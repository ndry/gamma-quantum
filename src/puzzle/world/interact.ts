import { v2 } from "../../utils/v";
import { directionVector, halfDirection2Vector } from "./direction";
import { eqParticleKind, keyifyParticleKind } from "../terms/ParticleKind";
import { particleMomentum } from "./Particle";
import * as hax from "../../utils/hax";
import { applyReactionsInPlace } from "../reactions/applyReactions";
import update from "immutability-helper";
import { pipe } from "fp-ts/lib/function";
import { World } from "./World";
import { trustedEntries } from "../../utils/trustedRecord";
import { parsePosition } from "../terms/Position";


export function interact(world: World) {
    const reactedWorld = {
        ...world,
        consumed: { ...world.consumed },
        particles: [...world.particles],
    };


    applyReactionsInPlace(reactedWorld.particles);

    const actors = [
        ...trustedEntries(world.init.actors),
        ...trustedEntries(world.init.problem.actors),
    ];
    for (const [positionKey, a] of actors) {
        const position = parsePosition(positionKey);
        if (a.kind === "spawner") {
            if (reactedWorld.step % 6 === 1) {
                reactedWorld.particles.push({
                    ...a.output,
                    position,
                    velocity: [...directionVector[a.direction]],
                    isRemoved: false,
                });
            }
        }
        if (a.kind === "consumer") {
            for (let i = reactedWorld.particles.length - 1; i >= 0; i--) {
                const p = reactedWorld.particles[i];
                if (!p || p.isRemoved) { continue; }
                if (!v2.eq(position, p.position)) {
                    continue;
                }

                if (eqParticleKind(p, a.input)) {
                    reactedWorld.particles[i] = update(p, {
                        isRemoved: { $set: true },
                    });
                    reactedWorld.consumed[keyifyParticleKind(p)] =
                        (reactedWorld.consumed[keyifyParticleKind(p)] ?? 0) + 1;
                }
            }
        }
        if (a.kind === "mirror") {
            for (let i = 0; i < reactedWorld.particles.length; i++) {
                const p = reactedWorld.particles[i];
                if (!p || p.isRemoved) { continue; }
                if (!v2.eq(position, p.position)) {
                    continue;
                }

                const mirrorNormal = halfDirection2Vector[a.direction];

                const m1 = particleMomentum(p);

                const vc = hax.toFlatCart(p.velocity);
                const nc = hax.toFlatCart(mirrorNormal);
                const vc1 = v2.add(vc, v2.scale(nc, -0.5 * v2.dot(vc, nc)));
                reactedWorld.particles[i] = update(p, {
                    velocity: {
                        $set: pipe(
                            vc1,
                            hax.fromFlatCart,
                            hax.round,
                        ),
                    },
                });

                const dm = v2.sub(m1, particleMomentum(p));
                reactedWorld.momentum = v2.add(
                    reactedWorld.momentum,
                    dm,
                );
            }
        }
        if (a.kind === "trap") {
            // acts on movement step
        }
    }

    for (let i = reactedWorld.particles.length - 1; i >= 0; i--) {
        const p = reactedWorld.particles[i];
        if ((p.content === "gamma") && (world.particles[i])) {
            reactedWorld.momentum = v2.add(
                reactedWorld.momentum,
                particleMomentum(reactedWorld.particles[i]),
            );
            reactedWorld.particles[i] = update(p, {
                isRemoved: { $set: true },
            });
        }
    }

    return reactedWorld;
}
