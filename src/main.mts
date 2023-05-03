import { onControlEvent } from "./control.mjs";
import { renderControl, startControlLoop } from "@triadica/touch-control";
import { createDepthTexture } from "./buffer.mjs";
import { atomDepthTexture, atomDevice } from "./globals.mjs";
import { createRenderer, resetCanvasSize } from "./render.mjs";
import spriteWGSL from "../shaders/sprite.wgsl?raw";
import updateSpritesWGSL from "../shaders/update-sprites.wgsl?raw";

window.onload = async () => {
  if (navigator.gpu == null) {
    alert("WebGPU is required to run this sample.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();

  atomDevice.reset(device);

  let canvas = document.querySelector("#canvas-container") as HTMLCanvasElement;
  renderControl();
  startControlLoop(10, onControlEvent);
  resetCanvasSize(canvas);

  atomDepthTexture.reset(createDepthTexture());

  let seedSize = 400;

  let renderFrame = await createRenderer(
    canvas,
    {
      seedSize,
      seedData: makeSeed(seedSize),
      params: loadParams(),
      computeShader: updateSpritesWGSL,
    },
    {
      vertexCount: 3,
      vertexData: loadVertex(),
      vertexBufferLayout: vertexBufferLayout,
      renderShader: spriteWGSL,
    }
  );

  let t = 0;
  let renderer = () => {
    t++;
    setTimeout(() => {
      requestAnimationFrame(renderer);
    }, 20);
    renderFrame(t);
  };

  renderer();
  window["rrr"] = renderer;

  window.onresize = () => {
    resetCanvasSize(canvas);
    atomDepthTexture.reset(createDepthTexture());
  };
};

function makeSeed(numParticles: number): Float32Array {
  const initialParticleData = new Float32Array(numParticles * 8);
  for (let i = 0; i < numParticles; ++i) {
    initialParticleData[6 * i + 0] = 2 * (Math.random() - 0.5);
    initialParticleData[6 * i + 1] = 2 * (Math.random() - 0.5);
    // initialParticleData[6 * i + 2] = 0;
    initialParticleData[6 * i + 2] = 2 * (Math.random() - 0.5);
    initialParticleData[6 * i + 3] = 0;
    initialParticleData[6 * i + 4] = 2 * (Math.random() - 0.5) * 0.1;
    initialParticleData[6 * i + 5] = 2 * (Math.random() - 0.5) * 0.1;
    // initialParticleData[6 * i + 6] = 0;
    initialParticleData[6 * i + 6] = 2 * (Math.random() - 0.5) * 0.1;
    initialParticleData[6 * i + 7] = 0;
  }

  return initialParticleData;
}

function loadParams(): number[] {
  const simParams = {
    deltaT: 0.04,
    rule1Distance: 0.1,
    rule2Distance: 0.025,
    rule3Distance: 0.025,
    rule1Scale: 0.02,
    rule2Scale: 0.05,
    rule3Scale: 0.005,
  };
  return [
    simParams.deltaT,
    simParams.rule1Distance,
    simParams.rule2Distance,
    simParams.rule3Distance,
    simParams.rule1Scale,
    simParams.rule2Scale,
    simParams.rule3Scale,
  ];
}

function loadVertex(): number[] {
  return [-0.01, -0.02, 0.01, -0.02, 0.0, 0.02];
}

let vertexBufferLayout: GPUVertexBufferLayout[] = [
  {
    // instanced particles buffer
    arrayStride: 8 * 4,
    stepMode: "instance",
    attributes: [
      { shaderLocation: 0, offset: 0, format: "float32x3" },
      { shaderLocation: 1, offset: 4 * 4, format: "float32x3" },
    ],
  },
  {
    // vertex buffer
    arrayStride: 2 * 4,
    stepMode: "vertex",
    attributes: [{ shaderLocation: 2, offset: 0, format: "float32x2" }],
  },
];

declare global {
  /** dirty hook for extracting error messages */
  var __lagopusHandleCompilationInfo: (
    info: GPUCompilationInfo,
    code: string
  ) => void;

  // to be triggered from command
  var rrr: () => void;
}
