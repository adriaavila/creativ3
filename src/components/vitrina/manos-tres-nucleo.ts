// three.js, second of four parts: the core the scene builds with (geometry, objects, the material), on the math
// of the first (manos-tres-mates.ts). Each part is its own module from three/src, imported in its own task before
// the scene (Manos.tsx): three's built file is one function of half a megabyte, and compiling and running it in
// one go held a 4x slower phone 130 to 250 ms. The scene imports these same modules, so nothing runs twice.
export { AdditiveBlending, NormalBlending } from "three/src/constants.js";
export { BufferAttribute } from "three/src/core/BufferAttribute.js";
export { BufferGeometry } from "three/src/core/BufferGeometry.js";
export { Color } from "three/src/math/Color.js";
export { Sphere } from "three/src/math/Sphere.js";
export { Vector3 } from "three/src/math/Vector3.js";
export { PerspectiveCamera } from "three/src/cameras/PerspectiveCamera.js";
export { PlaneGeometry } from "three/src/geometries/PlaneGeometry.js";
export { ShaderMaterial } from "three/src/materials/ShaderMaterial.js";
export { Group } from "three/src/objects/Group.js";
export { LineSegments } from "three/src/objects/LineSegments.js";
export { Mesh } from "three/src/objects/Mesh.js";
export { Points } from "three/src/objects/Points.js";
export { Scene } from "three/src/scenes/Scene.js";
