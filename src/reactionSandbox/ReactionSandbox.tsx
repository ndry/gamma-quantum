import { reactions } from "./reactions";
import { css } from "@emotion/css";
import { Particle } from "../puzzle/world/Particle";
import { useState } from "react";
import { ReactionMomentumGraph } from "./ReactionMomentumGraph";
import { ReactionVariants } from "./ReactionVariants";
import type { EmotionJSX } from "@emotion/react/types/jsx-namespace";
import { enumerateProductCombinations } from "../puzzle/reactions/enumerateProductCombinations";
import { ParticleKind } from "../puzzle/terms/ParticleKind";
import { ReagentEditor } from "./ReagentEditor";
import update from "immutability-helper";
import { ParticleText } from "./ParticleText";

export function ReactionSandbox({
    standalone,
    css: cssProp,
    ...props
}: {
    standalone?: boolean
} & EmotionJSX.IntrinsicElements["div"]) {
    const [showImpossibleReactions, setShowImpossibleReactions] =
        useState(true);

    const [selectedReaction, setSelectedReaction] = useState<{
        reagents: Particle[];
        products: Particle[];
        twins: Array<{ reagents: Particle[]; products: Particle[]; }>
    }>();

    const reagents = useState<Array<Particle | ParticleKind>>([{
        content: "gamma",
    }]);

    const x = [...enumerateProductCombinations(reagents[0])];

    const y = x.map(xx =>
        xx
            .map(xxx =>
                xxx
                    .map(xxxx => xxxx.subparticle[0])
                    .sort()
                    .join(""))
            .sort()
            .join(","));

    const sy = [...new Set(y)];

    const products = sy.map(py => py.split(",").map(s => ({
        content: [...s].reduce((acc, v) => {
            acc[{
                r: "red",
                g: "green",
                b: "blue",
            }[v]]++;
            return acc;
        }, {
            red: 0,
            green: 0,
            blue: 0,
        }),
    })));


    return <div
        css={[
            {
                display: "flex",
                flexDirection: "row",
            },
            standalone && {
                fontFamily: "monospace",
            },
            cssProp,
        ]}
        {...props}
    >

        <div className={css({
            overflow: "scroll",
            paddingRight: 20,
            flexShrink: 0,
            height: "100%",
        })}>
            {reagents[0].map((_, i) => <div key={i}>
                <ParticleText
                    css={{ display: "inline" }}
                    particle={reagents[0][i]} />
                <ReagentEditor

                    particleState={[
                        reagents[0][i],
                        _n => {
                            const n = "function" === typeof _n
                                ? _n(reagents[0][i])
                                : _n;
                            return reagents[1](update(reagents[0], {
                                [i]: { $set: n },
                            }));
                        },
                    ]}
                />
                <button
                    onClick={() =>
                        reagents[1](update(reagents[0], { $splice: [[i, 1]] }))}
                >
                    x
                </button>
            </div>)}
            <button
                css={{ width: "100px" }}
                onClick={() =>
                    reagents[1](update(reagents[0], {
                        $push:
                            [{ content: "gamma" }],
                    }))}
            >
                +
            </button>
            <br />
            
            <div>
                <label>
                    Show impossible reaction
                    <input
                        type="checkbox"
                        checked={showImpossibleReactions}
                        onChange={ev =>
                            setShowImpossibleReactions(ev.target.checked)}
                    />
                </label>
            </div>
            {products.map((p, i) =>
                <ReactionVariants
                    title={sy[i]}
                    key={i}
                    reaction={{
                        reagents: reagents[0],
                        products: p,
                    }}
                    setSelectedReactionVariant={setSelectedReaction}
                    showImpossibleReactions={showImpossibleReactions}
                />)}
        </div>
        {
            selectedReaction &&
            <ReactionMomentumGraph
                className={css({
                    flex: 1,
                })}
                {...selectedReaction}
            />
        }
    </div >;
}

