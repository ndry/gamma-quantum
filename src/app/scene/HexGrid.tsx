import { v2 } from "../../utils/v";
import { GroupProps, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CanvasTexture, CircleGeometry, DataTexture, Group, Mesh, MeshPhysicalMaterial, Plane, PointLight, Raycaster, RepeatWrapping, ShaderChunk, Texture, Vector3 } from "three";
import * as hax from "../../utils/hax";
import { _throw } from "../../utils/_throw";


const y0Plane = new Plane(new Vector3(0, 1, 0), 0);

const createCanvas = (draw: (ctx: CanvasRenderingContext2D) => void) => {
    const resolution = 64;
    const c = document.createElement("canvas");
    c.height = resolution;
    c.width = c.height * Math.sqrt(3);
    const ctx = c.getContext("2d");
    if (!ctx) { _throw("No 2d context"); }

    draw(ctx);

    return c;
};

function strokeHexGridTile(
    ctx: CanvasRenderingContext2D,
    d = ctx.canvas.height,
) {
    const halfOfHexagon = (cx: number, cy: number, r: number) => {
        const { cos, sin, PI } = Math;
        ctx.moveTo(
            cx + r * sin((-0.5) / 3 * PI),
            cy - r * cos((-0.5) / 3 * PI));
        for (let i = 0; i < 3; i++) {
            ctx.lineTo(
                cx + r * sin((i + 0.5) / 3 * PI),
                cy - r * cos((i + 0.5) / 3 * PI));
        }
    };

    for (const h of [[0, 0], [1, 0], [0, 1], [2, 0], [1, -1]] as const) {
        const [cx, cy] = hax.toFlatCart(h);
        ctx.beginPath();
        halfOfHexagon(cx * d, (cy + 0.25) * d, d / Math.sqrt(3));
        ctx.stroke();
    }
}

const haxShaderChunk = /*glsl*/`/* start haxShaderChunk */
const mat2x2 flatCartToAxialMatrix = mat2x2(
    2.0 / sqrt(3.0), -1.0 / sqrt(3.0), 0.0, 1.0);
const mat2x2 axialToFlatCartMatrix = inverse(flatCartToAxialMatrix);
vec2 cubeRound(vec2 v) {
    vec3 h = vec3(v, -v.x - v.y);
    vec3 rh = round(h);
    vec3 diff = abs(rh - h);

    if (diff.x > diff.y && diff.x > diff.z) {
        return vec2(-rh.y - rh.z, rh.y);
    } else if (diff.y > diff.z) {
        return vec2(rh.x, -rh.x - rh.z);
    } else {
        return rh.xy;
    }
}
/* end haxShaderChunk */`;

function procSampler_normal_fragment_maps(
    fragmentShader: string,
    sampler: (varName: string) => string,
) {
    const chunk = ShaderChunk["normal_fragment_maps"]
        .replaceAll(
            "vec3 mapN = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;",
            sampler("mapN"));
    return fragmentShader
        .replaceAll("#include <normal_fragment_maps>", chunk);
}

const createMaterial = ({
    size,
    positions,
    positionsMode,
}: {
    size: number,
    positions: v2[],
    positionsMode: "ban" | "allow",
}) => {

    const setSampler = <T extends Texture>(txt: T) => {
        txt.wrapS = RepeatWrapping;
        txt.wrapT = RepeatWrapping;
        txt.repeat.set(size / Math.sqrt(3), size);
        txt.offset
            .set(0, -0.25)
            .addScaledVector(txt.repeat, -0.5);

        return txt;
    };

    const fakeTxt = setSampler(new DataTexture());

    const m = new MeshPhysicalMaterial({
        color: "#030d20",
        roughness: 1,
        metalness: 1,
        metalnessMap: setSampler(new CanvasTexture(createCanvas((ctx) => {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "#fafafa";
            strokeHexGridTile(ctx);
        }))),
        roughnessMap: setSampler(new CanvasTexture(createCanvas((ctx) => {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "#fafafa";
            strokeHexGridTile(ctx);
        }))),
        emissiveIntensity: 0.005,
        emissive: "white",
        emissiveMap: setSampler(new CanvasTexture(createCanvas((ctx) => {
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

            ctx.lineWidth = 1;
            ctx.strokeStyle = "#ffffff";
            strokeHexGridTile(ctx);
        }))),
        normalMap: fakeTxt,
    });
    m.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader
            .replaceAll(
                "void main() {",
                /*glsl*/`
varying vec3 vWorldPosition;
void main() {`)
            .replaceAll(
                "}",
                `vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
}`);
        // console.log(shader.vertexShader);

        shader.fragmentShader = shader.fragmentShader
            .replaceAll(
                "void main() {",
                /*glsl*/`
${haxShaderChunk}
varying vec3 vWorldPosition;

void main() {`,
            )
            .replaceAll(
                "vec4 diffuseColor = vec4( diffuse, opacity );",
                /*glsl*/`
vec4 diffuseColor = vec4( diffuse, opacity );
// vec2 hexPosFrac = 
//     flatCartToAxialMatrix * vec2(vUv.x * sqrt(3.0), vUv.y + 0.25);
vec2 hexPosFrac = flatCartToAxialMatrix * vWorldPosition.xz;
vec2 hexPos = cubeRound(hexPosFrac);
bool canBuild = ${positionsMode === "allow" ? "false" : "true"};
vec2 hexFrac = hexPosFrac - hexPos;
vec3 at3 = abs(vec3(hexFrac, -hexFrac.x - hexFrac.y));
float hexFracDist = max3(at3 + vec3(at3.y, at3.z, at3.x));
    
if (false${positions
                    .map(([x, y]) => ` || (hexPos == vec2(${x}.0, ${y}.0))`)
                    .join("")
                }) {
    canBuild = !canBuild;
}

if (!canBuild) {
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05), 0.08);
} else {
    if (hexFracDist > 0.7) {
        diffuseColor.rgb *= (0.9 + hexFracDist * 0.3);
    }
}
`,
            );

        shader.fragmentShader = procSampler_normal_fragment_maps(
            shader.fragmentShader,
            varName => /*glsl*/`
    vec3 ${varName} = (hexFracDist > (canBuild ? 0.7 : 0.97))
        ? vec3(0.0, 0.0, 1.0)
        : vec3(
            axialToFlatCartMatrix * hexFrac, 
            3.5 / hexFracDist);
 `);

        // console.log(shader.fragmentShader);
    };

    return m;
};

export function HexGrid({
    positions,
    positionsMode,
    ...props
}: {
    positions: v2[],
    positionsMode: "ban" | "allow",
} & Omit<GroupProps, "ref">) {
    const ref = useRef<Group>(null);
    const cursorLightRef = useRef<PointLight>(null);

    const { obj: grid, dispose } = useMemo(() => {
        const size = 3000;
        const g = new CircleGeometry(size / 2, 16);
        g.rotateX(-Math.PI / 2);
        const m = createMaterial({ size, positions, positionsMode });
        const obj = new Mesh(g, m);

        return {
            obj,
            dispose: () => {
                g.dispose();
                m.dispose();
            },
        };
    }, [positions, positionsMode]);
    useEffect(() => dispose, [dispose]);

    useFrame(({ camera }) => {
        // Hex grid plane to follow the camera

        const g = ref.current;
        if (!g) { return; }

        const raycaster = new Raycaster();
        raycaster.setFromCamera({ x: 0, y: 0 }, camera);
        const point = new Vector3();
        raycaster.ray.intersectPlane(y0Plane, point);
        const p1 =
            hax.toFlatCart(hax.round(hax.fromFlatCart([point.x, point.z])));
        grid.position.set(p1[0], 0, p1[1]);
        g.worldToLocal(grid.position);
    });

    useFrame(({ camera, pointer }) => {
        // Light to follow the pointer

        const g = ref.current;
        if (!g) { return; }
        const light = cursorLightRef.current;
        if (!light) { return; }

        const raycaster = new Raycaster();
        raycaster.setFromCamera(pointer, camera);
        const point = new Vector3();
        raycaster.ray.intersectPlane(y0Plane, point);
        light.position.copy(point);
        light.position.y += 2;
        g.worldToLocal(light.position);
    });

    return <group ref={ref} {...props} >
        <primitive object={grid} />
        <pointLight
            ref={cursorLightRef}
            intensity={1}
            power={1000}
            color={"#ffffff"}
        >
            {/* <Box /> */}
        </pointLight>
    </group>;
}
