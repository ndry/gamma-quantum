import { v3 } from "../utils/v";
import { generateReactionVariants } from "./generateReactionVariants";
import { selectReactionVariant } from "./selectReactionVariant";
import { ParticleState } from "./step";
import { ParticleKind } from "./terms";
import update from "immutability-helper";

type Reaction =
    (p1: ParticleState) => (
        undefined
        | ParticleKind[]
        | ((p2: ParticleState) => (
            undefined
            | ParticleKind[]
            | ((p3: ParticleState) => (
                undefined
                | ParticleKind[]
                | never
            ))
        ))
    );

const reactions: Reaction[] = [
    p1 => {
        const c1 = p1.content;
        if (c1 === "gamma") { return; }
        if (Array.isArray(c1)) { return; }
        return p2 => {
            const c2 = p2.content;
            if (c2 === "gamma") { return; }
            if (Array.isArray(c2)) { return; }

            return [{
                content: [c1, c2]
            }];
        }
    },
    p1 => {
        const c1 = p1.content;
        if (c1 === "gamma") { return; }
        if (Array.isArray(c1)) { return; }
        return p2 => {
            const c2 = p2.content;
            if (c2 === "gamma") { return; }
            if (!Array.isArray(c2)) { return; }
            if (c2.length >= 4) { return; }

            return [{
                content: [c1, ...c2]
            }];
        }
    },
    p1 => {
        const c1 = p1.content;
        if (c1 === "gamma") { return; }
        if (!Array.isArray(c1)) { return; }
        if (c1.length >= 4) { return; }
        return p2 => {
            const c2 = p2.content;
            if (c2 === "gamma") { return; }
            if (!Array.isArray(c2)) { return; }
            if (c1.length + c2.length > 4) { return; }

            return [{
                content: [...c1, ...c2]
            }];
        }
    },
    p1 => {
        const c1 = p1.content;
        if (!Array.isArray(c1)) { return; }
        if (c1.length !== 2) { return; }
        return p2 => {
            const c2 = p2.content;
            if (c2 !== "gamma") { return; }

            return [{
                content: c1[0],
            }, {
                content: c1[1],
            }];
        }
    },
    p1 => {
        const c1 = p1.content;
        if (!Array.isArray(c1)) { return; }
        if (c1.length !== 4) { return; }
        return p2 => {
            const c2 = p2.content;
            if (c2 !== "gamma") { return; }

            return [{
                content: [c1[0], c1[1]],
            }, {
                content: [c1[2], c1[3]],
            }];
        }
    },
    p1 => {
        const c1 = p1.content;
        if (!Array.isArray(c1)) { return; }
        if (c1.length !== 4) { return; }
        return p2 => {
            const c2 = p2.content;
            if (c2 !== "gamma") { return; }

            return p3 => {
                const c3 = p3.content;
                if (c3 !== "gamma") { return; }

                return [{
                    content: [c1[0], c1[1]],
                }, {
                    content: [c1[2], c1[3]],
                }];
            }
        }
    },
];

export function applyReactionsInPlace(particles: ParticleState[]) {
    const newParticles = [] as ParticleState[];

    for (const reaction of reactions) {
        while ((() => {
            for (const p1 of particles) {
                if (p1.isRemoved) { continue; }
                const r1 = reaction(p1);
                if (!r1) { continue; }
                if (typeof r1 === "function") {
                    for (const p2 of particles) {
                        if (p2.isRemoved) { continue; }
                        if (p1 === p2) { continue; }
                        if (!v3.eqStrict(p1.position, p2.position)) { continue; }

                        const r2 = r1(p2);
                        if (!r2) { continue; }
                        if (typeof r2 === "function") {
                            for (const p3 of particles) {
                                if (p3.isRemoved) { continue; }
                                if (p1 === p3) { continue; }
                                if (p2 === p3) { continue; }
                                if (!v3.eqStrict(p1.position, p3.position)) { continue; }
                                if (!v3.eqStrict(p2.position, p3.position)) { continue; }

                                const r3 = r2(p3);
                                if (!r3) { continue; }
                                if (typeof r3 === "function") {

                                    throw "not implemented";

                                    continue;
                                }

                                const requestedReaction = {
                                    reagents: [p1, p2, p3],
                                    products: r3,
                                };
                                const variants = generateReactionVariants(requestedReaction);
                                const {
                                    selectedVariant
                                } = selectReactionVariant({
                                    requestedReaction,
                                    variants,
                                });
                                if (selectedVariant) {
                                    particles[particles.indexOf(p1)] = update(p1, {
                                        isRemoved: { $set: true, }
                                    });
                                    particles[particles.indexOf(p2)] = update(p2, {
                                        isRemoved: { $set: true, }
                                    });
                                    newParticles.push(...selectedVariant.products.map(p => ({
                                        ...p,
                                        position: p1.position,
                                        step: 0,
                                        isRemoved: false,
                                    })));

                                    return true;
                                }
                            }


                            continue;
                        }


                        const requestedReaction = {
                            reagents: [p1, p2],
                            products: r2,
                        };
                        const variants = generateReactionVariants(requestedReaction);
                        const {
                            selectedVariant
                        } = selectReactionVariant({
                            requestedReaction,
                            variants,
                        });
                        if (selectedVariant) {
                            particles[particles.indexOf(p1)] = update(p1, {
                                isRemoved: { $set: true, }
                            });
                            particles[particles.indexOf(p2)] = update(p2, {
                                isRemoved: { $set: true, }
                            });
                            newParticles.push(...selectedVariant.products.map(p => ({
                                ...p,
                                position: p1.position,
                                step: 0,
                                isRemoved: false,
                            })));

                            return true;
                        }

                    }
                    continue;
                }

                throw "not implemented";

                return true;
            }
            return false;
        })()) { /* */ }
    }

    particles.push(...newParticles);
}