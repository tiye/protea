import { createRenderer, resetCanvasSize } from "./render.mjs";
import spriteWGSL from "../shaders/sprite.wgsl?raw";
import updateSpritesWGSL from "../shaders/update-sprites.wgsl?raw";
import computeGravityWgsl from "../shaders/compute-gravity.wgsl?raw";
import computeLorenz from "../shaders/compute-lorenz.wgsl?raw";

export let loadRenderer = async (canvas: HTMLCanvasElement) => {
  let seedSize = 4000000;

  let renderFrame = await createRenderer(
    canvas,
    {
      seedSize,
      seedData: makeSeed(seedSize, 300),
      params: loadParams(),
      // computeShader: updateSpritesWGSL,
      // computeShader: computeGravityWgsl,
      computeShader: computeLorenz,
    },
    {
      vertexCount: 1,
      vertexData: loadVertex(),
      indexData: [0, 1, 2, 1, 2, 3],
      vertexBufferLayout: vertexBufferLayout,
      renderShader: spriteWGSL,
      // topology: "line-list",
      bgColor: [0.1, 0.0, 0.2, 1.0],
    }
  );

  return renderFrame;
};

function makeSeed(numParticles: number, scale: number): Float32Array {
  const buf = new Float32Array(numParticles * 8);
  let offset = 0.5;
  for (let i = 0; i < numParticles; ++i) {
    let b = 8 * i;
    buf[b + 0] = (Math.random() - offset) * scale;
    buf[b + 1] = (Math.random() - offset) * scale;
    buf[b + 2] = (Math.random() - offset) * scale;
    buf[b + 3] = 0; // ages
    buf[b + 4] = 0;
    buf[b + 5] = 0;
    buf[b + 6] = 0;
    buf[b + 7] = 0; // distance
  }

  return buf;
}

function loadParams(): number[] {
  const simParams = {
    deltaT: 0.0001,
    height: 0.6,
    width: 0.2,
    opacity: 0.8,
    rule1Scale: 0.02,
    rule2Scale: 0.05,
    rule3Scale: 0.005,
  };
  return [
    simParams.deltaT,
    simParams.height,
    simParams.width,
    simParams.opacity,
    simParams.rule1Scale,
    simParams.rule2Scale,
    simParams.rule3Scale,
  ];
}

function loadVertex(): number[] {
  // prettier-ignore
  return [
    0, 1, 2, 3
    // -0.06, -0.06, -0.03,
    // 0.06, -0.06, -0.03,
    // 0.0, 0.06, 0,
    // 0.0, -0.06, 0.03,
  ];
}

let vertexBufferLayout: GPUVertexBufferLayout[] = [
  {
    // instanced particles buffer
    arrayStride: 8 * 4,
    stepMode: "instance",
    attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x3" },
      { shaderLocation: 1, offset: 3 * 4, format: "float32" },
      { shaderLocation: 2, offset: 4 * 4, format: "float32x3" },
      { shaderLocation: 3, offset: 7 * 4, format: "float32" },
    ],
  },
  {
    // vertex buffer
    arrayStride: 1 * 4,
    stepMode: "vertex",
    attributes: [{ shaderLocation: 4, offset: 0, format: "uint32" }],
  },
];

if (import.meta.hot) {
  import.meta.hot.accept("./globals", (newModule) => {
    // globals reloading
  });
}
