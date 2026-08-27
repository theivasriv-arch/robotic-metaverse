// js/assembly.js

/**
 * Member 3: Virtual Assembly and Interaction System
 * Main Interface function called by Member 5 during integration.
 */
function initializeAssembly(scene, camera, renderer, interactiveObjects) {
    console.log("Assembly module initialized.");

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    let selectedObject = null;
    let plane = new THREE.Plane();
    let raycasterPlane = new THREE.Vector3();
    let intersection = new THREE.Vector3();
    let offset = new THREE.Vector3();

    // Define a target snap point (e.g., where the wheel connects to the base)
    const targetSnapPoint = new THREE.Vector3(2, 0, 0); 
    const snapDistanceThreshold = 0.8; // Distance required to trigger a snap

    const canvas = renderer.domElement;

    // Helper function to safely apply material changes (handles arrays and groups)
    function setMaterialEmissive(obj, hexColor) {
        obj.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        if (mat.emissive) mat.emissive.setHex(hexColor);
                    });
                } else if (child.material.emissive) {
                    child.material.emissive.setHex(hexColor);
                }
            }
        });
    }

    // 1. Mouse Down: Select an object to drag
    canvas.addEventListener('pointerdown', (event) => {
        event.preventDefault();

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects, true);

        if (intersects.length > 0) {
            selectedObject = intersects[0].object;

            // Traverse up to find the root group if it's part of an assembly component
            while (selectedObject.parent && selectedObject.parent.type === "Group" && selectedObject.parent !== scene) {
                selectedObject = selectedObject.parent;
            }

            // Create a plane facing the camera to track drag movement
            plane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(raycasterPlane).negate(), selectedObject.position);
            
            if (raycaster.ray.intersectPlane(plane, intersection)) {
                offset.copy(intersection).sub(selectedObject.position);
            }

            // Visual feedback: Use emissive highlight instead of overwriting base color
            setMaterialEmissive(selectedObject, 0x0000ff);
            
            console.log("Component selected for assembly:", selectedObject);
        }
    });

    // 2. Mouse Move: Drag the selected object
    canvas.addEventListener('pointermove', (event) => {
        event.preventDefault();

        if (!selectedObject) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        if (raycaster.ray.intersectPlane(plane, intersection)) {
            selectedObject.position.copy(intersection.sub(offset));
        }
    });

    // 3. Mouse Up: Drop object and check for snapping
    canvas.addEventListener('pointerup', (event) => {
        if (selectedObject) {
            // Reset material emissive highlight
            setMaterialEmissive(selectedObject, 0x000000);

            // Check distance to target connection/snap point
            const distance = selectedObject.position.distanceTo(targetSnapPoint);

            if (distance < snapDistanceThreshold) {
                // SNAP SUCCESS
                selectedObject.position.copy(targetSnapPoint);
                console.log("Component successfully snapped into place!");
                // TODO: Trigger progress update for Member 5's UI
            } else {
                console.log("Placement out of range.");
            }

            selectedObject = null;
        }
    });
}