import { useEffect, useRef } from 'react';
import { Renderer, Camera, Transform, Plane, Mesh, Program, Texture, Color } from 'ogl';

interface CircularGalleryProps {
    items?: { image: string; text: string }[];
    bend?: number;
    textColor?: string;
    borderRadius?: number;
    scrollSpeed?: number;
    scrollEase?: number;
}

const vertex = /* glsl */ `
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uBend;
  uniform float uTime;
  uniform float uIndex;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Add a gentle floating/swaying animation
    float angle = uTime * 0.5 + uIndex;
    pos.y += sin(angle) * 0.1;
    pos.x += cos(angle * 0.8) * 0.05;
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    
    // Apply bend effect: subtle curve
    mvPosition.z -= pow(abs(mvPosition.x), 1.5) * uBend;
    
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tMap;
  uniform float uBorderRadius;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 d = abs(uv - 0.5) - (0.5 - uBorderRadius);
    float dist = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
    float alpha = 1.0 - smoothstep(0.0, 0.01, dist - uBorderRadius);

    vec4 color = texture2D(tMap, uv);
    
    gl_FragColor = vec4(color.rgb, color.a * alpha);
    if (gl_FragColor.a < 0.01) discard;
  }
`;

export default function CircularGallery({
    items = [],
    bend = 1,
    textColor = "#000000",
    borderRadius = 0.01,
    scrollSpeed = 1.5,
    scrollEase = 0.05
}: CircularGalleryProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current || items.length === 0) return;

        const container = containerRef.current;
        const renderer = new Renderer({ alpha: true, antialias: true, dpr: window.devicePixelRatio });
        const gl = renderer.gl;
        gl.canvas.style.display = 'block';
        gl.canvas.style.width = '100%';
        gl.canvas.style.height = '100%';
        container.appendChild(gl.canvas);

        const camera = new Camera(gl, { fov: 40 });
        camera.position.z = 7;

        const scene = new Transform();
        // Smaller images for a more "aesthetic" look
        const planeGeometry = new Plane(gl, { width: 2.2, height: 3.0, widthSegments: 30 });

        const meshes: Mesh[] = [];

        items.forEach((item, i) => {
            const texture = new Texture(gl, { generateMipmaps: false });
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = item.image;
            img.onload = () => {
                texture.image = img;
                texture.needsUpdate = true;
            };

            const program = new Program(gl, {
                vertex,
                fragment,
                uniforms: {
                    tMap: { value: texture },
                    uBend: { value: bend * 0.12 },
                    uBorderRadius: { value: borderRadius }
                },
                transparent: true
            });

            const mesh = new Mesh(gl, { geometry: planeGeometry, program });
            mesh.position.x = (i - (items.length - 1) / 2) * 2.8;
            mesh.setParent(scene);
            meshes.push(mesh);
        });

        let scroll = 0;
        let targetScroll = 0;
        let isDragging = false;
        let startX = 0;

        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                e.preventDefault();
                targetScroll += e.deltaX * 0.005 * scrollSpeed;
            } else {
                targetScroll += e.deltaY * 0.005 * scrollSpeed;
            }

            const limit = (items.length - 1) * 2.8 / 2 + 1.5;
            targetScroll = Math.max(-limit, Math.min(limit, targetScroll));
        };

        const onMouseDown = (e: MouseEvent) => {
            isDragging = true;
            startX = e.clientX;
            container.style.cursor = 'grabbing';
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const delta = e.clientX - startX;
            targetScroll -= delta * 0.01 * scrollSpeed;
            startX = e.clientX;

            const limit = (items.length - 1) * 2.8 / 2 + 1.5;
            targetScroll = Math.max(-limit, Math.min(limit, targetScroll));
        };

        const onMouseUp = () => {
            isDragging = false;
            container.style.cursor = 'grab';
        };

        container.addEventListener('wheel', onWheel, { passive: false });
        container.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);

        let request: number;

        const update = () => {
            scroll += (targetScroll - scroll) * scrollEase;

            // Better way to handle horizontal position based on total scroll
            meshes.forEach((mesh, i) => {
                mesh.position.x = (i - (items.length - 1) / 2) * 2.8 - scroll;
            });

            renderer.render({ scene, camera });
            request = requestAnimationFrame(update);
        };

        const onResize = () => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            if (w === 0 || h === 0) return;
            renderer.setSize(w, h);
            camera.perspective({ aspect: w / h });
        };

        window.addEventListener('resize', onResize);
        onResize();
        update();

        return () => {
            container.removeEventListener('wheel', onWheel);
            container.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(request);
            if (container.contains(gl.canvas)) {
                container.removeChild(gl.canvas);
            }
        };
    }, [items, bend, borderRadius, scrollSpeed, scrollEase]);

    return (
        <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-transparent cursor-grab transition-opacity duration-1000">
            <div className="absolute bottom-12 left-0 w-full flex justify-center pointer-events-none">
                <div className="flex flex-col items-center gap-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-black/20 animate-pulse">
                        Drag to Orbit
                    </p>
                    <div className="w-12 h-[1px] bg-black/10"></div>
                </div>
            </div>
        </div>
    );
}
