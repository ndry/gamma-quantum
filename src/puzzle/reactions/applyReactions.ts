import { enumerateProductVelocities } from "./enumerateProductVelocities";
import { selectReactionVariant } from "./selectReactionVariant";
import { ParticleState } from "../world";
import { Particle, keyifyParticle, particlesEnergy, particlesMomentum } from "../world/Particle";
import _ from "lodash";
import { enumerateProductCombinations } from "./enumerateProductCombinations";
import { eqParticleKind } from "../terms/ParticleKind";
import { v2 } from "../../utils/v";
import update from "immutability-helper";
import memoize from "memoizee";

const resolveReactionInCell = memoize((reagents: Particle[]) => {
    const reagentsEnergy = particlesEnergy(reagents);
    const reagentsMomentum = particlesMomentum(reagents);
    const {
        selectedVariant,
    } = selectReactionVariant([...enumerateProductCombinations(reagents)
        .flatMap(products => enumerateProductVelocities(
            reagentsMomentum,
            reagentsEnergy,
            products))
        .map(products => ({ reagents, products }))]);

    return selectedVariant?.products ?? reagents;
}, {
    normalizer: ([reagents]) =>
        JSON.stringify(reagents.map(keyifyParticle).sort()),
    max: 1000,
});

const eqParticle = (p1: Particle, p2: Particle) =>
    eqParticleKind(p1, p2) && v2.eq(p1.velocity, p2.velocity);

const asUpdated = (reagents: ParticleState[], products: Particle[]) => {
    reagents = [...reagents];
    return products.map(p => {
        const i = reagents.findIndex(r => eqParticle(r, p));
        if (i >= 0) {
            const r = reagents[i];
            reagents.splice(i, 1);
            return r;
        }
        return {
            ...p,
            position: reagents[0].position,
            isRemoved: false,
        };
    });
};

export function applyReactionsInPlace(particles: ParticleState[]) {
    const newParticles = Object.values(_.groupBy(
        particles.filter(p => !p.isRemoved),
        p => JSON.stringify(p.position)),
    ).flatMap(reagents =>
        asUpdated(reagents, resolveReactionInCell(reagents)));

    for (const p of newParticles) {
        if (particles.includes(p)) { continue; }
        particles.push(p);
    }

    for (const p of particles) {
        if (newParticles.includes(p)) { continue; }
        particles[particles.indexOf(p)] = update(p, {
            isRemoved: { $set: true },
        });
    }
}