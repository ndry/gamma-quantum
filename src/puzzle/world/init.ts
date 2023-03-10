import { v2 } from "../../utils/v";
import { SolutionDraft } from "../terms/Solution";
import { World } from "./World";

export const init = (solution: SolutionDraft): World => {
    return ({
        ...solution,
        init: solution,
        action: "init",
        step: 0,
        energy: 0,
        momentum: v2.zero(),
        consumed: {},
        particles: [],
    });
};
