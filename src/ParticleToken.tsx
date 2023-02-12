import { useFrame } from "@react-three/fiber";
import { PlayAction } from "./PlaybackPanel";
import { ParticleState } from "./puzzle/step";
import { ParticleKind } from "./puzzle/terms";
import { directionOf } from "./reactionSandbox/ParticleText";
import * as hg from "./utils/hg";

const getColors = (p: ParticleKind) =>
    (() => {
        if (Array.isArray(p.content)) { return p.content; }
        return [p.content];
    })().map(c => c === "gamma" ? "white" : c);

export function ParticleToken({
    particle: p,
    move,

    playAction,
}: {
    particle: ParticleState;
    move?: {
        prev: ParticleState,
        next: ParticleState,
    },

    playAction: PlayAction,
}) {
    const colors = getColors(p);

    // const transition = getTransition(playAction.startPlaytime);

    const timeStartReal = performance.now();
    useFrame(() => {
        // const transitionCurrent = getTransition(nowPlaytime(playAction), transition);

        // if (transitionCurrent === transition) { return; }

        // todo: trigger render here
    })


    return <group>
        <mesh>
            <cylinderGeometry args={[0.4, 0.4, 0.1]} />
            <meshPhongMaterial
                color={"white"}
                transparent
                opacity={0.2} />
        </mesh>
        {(() => {
            switch (colors.length) {
                case 1: return <>
                    <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshPhongMaterial color={colors[0]} />
                    </mesh>
                </>;
                case 2: return <>
                    <mesh position={[0.07, 0, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshPhongMaterial color={colors[0]} />
                    </mesh>
                    <mesh position={[-0.07, 0, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshPhongMaterial color={colors[1]} />
                    </mesh>
                </>;
                case 3: return <>
                    <mesh position={[0.07, 0, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshPhongMaterial color={colors[0]} />
                    </mesh>
                    <mesh position={[-0.02, 0, 0.05]}>
                        <sphereGeometry args={[0.1]} />
                        <meshPhongMaterial color={colors[0]} />
                    </mesh>
                    <mesh position={[-0.02, 0, -0.05]}>
                        <sphereGeometry args={[0.1]} />
                        <meshPhongMaterial color={colors[1]} />
                    </mesh>
                </>;
                case 4: return <>
                    <mesh position={[0.07, 0, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshPhongMaterial color={colors[0]} />
                    </mesh>
                    <mesh position={[-0.07, 0, 0]}>
                        <sphereGeometry args={[0.1]} />
                        <meshPhongMaterial color={colors[1]} />
                    </mesh>
                    <mesh position={[0, 0, 0.07]}>
                        <sphereGeometry args={[0.1]} />
                        <meshPhongMaterial color={colors[0]} />
                    </mesh>
                    <mesh position={[0, 0, -0.07]}>
                        <sphereGeometry args={[0.1]} />
                        <meshPhongMaterial color={colors[1]} />
                    </mesh>
                </>;
                default: throw "not supproted";
            }
        })()}
        <group
            rotation={[0, -Math.PI / 3 * directionOf(p.velocity)[0], 0]}
        >
            {hg.cubeLen(p.velocity) > 0 &&
                <mesh
                    position={[0, 0, 0.55]}
                    rotation={[Math.PI / 2, 0, 0]}
                >
                    <cylinderGeometry args={[0.02, 0.02, 0.3]} />
                    <meshPhongMaterial
                        color={"white"}
                        transparent
                        opacity={0.2} />
                </mesh>}
        </group>
    </group>;
}