import memoize from "memoizee";
import { Solution } from "./puzzle/terms";
import { init as _init, step as _step, World } from "./puzzle/step";

export type StateChain<State, InitArgs> =
    InitArgs & ({
        init: InitArgs;
    } | {
        prev: StateChain<State, InitArgs>;
    }) & State;

export type StateAtPlaytimeGetter<TState, TInitArgs> =
    (initArgs: TInitArgs, playtime: number) => StateChain<TState, TInitArgs>;


const init = memoize(_init);
const step = memoize(_step);
const getWorldAtKeyPlaytime = memoize(
    (solution: Solution, keyPlaytime: number): World =>
        keyPlaytime === 0
            ? init(solution)
            : step(getWorldAtKeyPlaytime(solution, keyPlaytime - 1)));

export const getKeyPlaytime = (playtime: number) => Math.max(0, Math.floor(playtime));

export const getWorldAtPlaytime = (solution: Solution, playtime: number) =>
    getWorldAtKeyPlaytime(solution, getKeyPlaytime(playtime));