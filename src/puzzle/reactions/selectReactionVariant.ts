import _ from "lodash";
import { tuple } from "../../utils/tuple";
import { groupReactionVariantsBySymmetries } from "./groupReactionVariantsBySymmetries";
import { ResolvedReaction } from "./Reaction";
import { socreResolvedReaction } from "./scoreResolvedReaction";

export function selectReactionVariant(variants: ResolvedReaction[]) {
    const allGrouppedVariants =
        Object.entries(_.groupBy(variants, socreResolvedReaction))
            .map(([k, v]) => tuple(k, groupReactionVariantsBySymmetries(v)));

    allGrouppedVariants.sort((g1, g2) => g1[0].localeCompare(g2[0], "en"));

    const filteredGrouppedVariants = allGrouppedVariants
        .map(([k, v]) => tuple(k, v.filter(v => v.length === 1)))
        .filter(([, v]) => v.length === 1);

    const selectedVariant = filteredGrouppedVariants[0]?.[1].length === 1
        ? filteredGrouppedVariants[0][1][0][0]
        : undefined;

    const noVariants = filteredGrouppedVariants.length === 0;

    const isResolved = noVariants || !!selectedVariant;

    return {
        allGrouppedVariants,
        filteredGrouppedVariants,
        selectedVariant,
        noVariants,
        isResolved,
    };
}
