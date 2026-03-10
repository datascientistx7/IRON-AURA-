/**
 * LightPillar Utility
 * Ported from React Three Fiber to Vanilla JS
 * Uses Three.js (Umd build expected)
 */

export default class LightPillar {
    constructor(container, options = {}) {
        if (!container) return;
        this.container = container;
        this.options = {
            topColor: '#5227FF',
            bottomColor: '#FF9FFC',
            intensity: 1.0,
            rotationSpeed: 0.3,
            interactive: false,
            glowAmount: 0.005,
            pillarWidth: 3.0,
            pillarHeight: 0.4,
            noiseIntensity: 0.5,
            mixBlendMode: 'screen',
            pillarRotation: 0,
            ...options
        };

        this.mouse = { x: 0, y: 0 };
        this.time = 0;
        this.isVisible = false;
        this.animationId = null;
        this.lastTime = performance.now();
        this.targetFPS = 60;
        this.frameTime = 1000 / this.targetFPS;

        this.init();
    }

    init() {
        this.setupStyles();
        this.setupObserver();
    }

    setupStyles() {
        this.container.style.mixBlendMode = this.options.mixBlendMode;
    }

    setupObserver() {
        this.observer = new IntersectionObserver(
            entries => {
                const entry = entries[0];
                this.isVisible = entry.isIntersecting;
                if (this.isVisible) {
                    if (!this.renderer) this.initializeWebGL();
                    this.startAnimation();
                } else {
                    this.stopAnimation();
                }
            },
            { threshold: 0.1 }
        );
        this.observer.observe(this.container);
    }

    initializeWebGL() {
        if (!window.THREE) {
            console.error('Three.js not found. Please ensure it is loaded.');
            return;
        }

        const THREE = window.THREE;
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Renderer
        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: false,
                alpha: true,
                powerPreference: 'high-performance',
                precision: 'lowp',
                stencil: false,
                depth: false
            });
        } catch (error) {
            console.error('Failed to create WebGL renderer:', error);
            return;
        }

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Scene & Camera
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Colors
        const parseColor = hex => {
            const color = new THREE.Color(hex);
            return new THREE.Vector3(color.r, color.g, color.b);
        };

        // Shaders
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec2 uMouse;
            uniform vec3 uTopColor;
            uniform vec3 uBottomColor;
            uniform float uIntensity;
            uniform bool uInteractive;
            uniform float uGlowAmount;
            uniform float uPillarWidth;
            uniform float uPillarHeight;
            uniform float uNoiseIntensity;
            uniform float uPillarRotation;
            varying vec2 vUv;

            const float PI = 3.141592653589793;
            const float EPSILON = 0.001;
            const float E = 2.71828182845904523536;
            const float HALF = 0.5;

            mat2 rot(float angle) {
                float s = sin(angle);
                float c = cos(angle);
                return mat2(c, -s, s, c);
            }

            float noise(vec2 coord) {
                float G = E;
                vec2 r = (G * sin(G * coord));
                return fract(r.x * r.y * (1.0 + coord.x));
            }

            vec3 applyWaveDeformation(vec3 pos, float timeOffset) {
                float frequency = 1.0;
                float amplitude = 1.0;
                vec3 deformed = pos;
                
                for(float i = 0.0; i < 4.0; i++) {
                    deformed.xz *= rot(0.4);
                    float phase = timeOffset * i * 2.0;
                    vec3 oscillation = cos(deformed.zxy * frequency - phase);
                    deformed += oscillation * amplitude;
                    frequency *= 2.0;
                    amplitude *= HALF;
                }
                return deformed;
            }

            float blendMin(float a, float b, float k) {
                float scaledK = k * 4.0;
                float h = max(scaledK - abs(a - b), 0.0);
                return min(a, b) - h * h * 0.25 / scaledK;
            }

            float blendMax(float a, float b, float k) {
                return -blendMin(-a, -b, k);
            }

            void main() {
                vec2 fragCoord = vUv * uResolution;
                vec2 uv = (fragCoord * 2.0 - uResolution) / uResolution.y;
                
                float rotAngle = uPillarRotation * PI / 180.0;
                uv *= rot(rotAngle);

                vec3 origin = vec3(0.0, 0.0, -10.0);
                vec3 direction = normalize(vec3(uv, 1.0));

                float maxDepth = 50.0;
                float depth = 0.1;

                mat2 rotX = rot(uTime * 0.3);
                if(uInteractive && length(uMouse) > 0.0) {
                    rotX = rot(uMouse.x * PI * 2.0);
                }

                vec3 color = vec3(0.0);
                
                for(float i = 0.0; i < 100.0; i++) {
                    vec3 pos = origin + direction * depth;
                    pos.xz *= rotX;

                    vec3 deformed = pos;
                    deformed.y *= uPillarHeight;
                    deformed = applyWaveDeformation(deformed + vec3(0.0, uTime, 0.0), uTime);
                    
                    vec2 cosinePair = cos(deformed.xz);
                    float fieldDistance = length(cosinePair) - 0.2;
                    
                    float radialBound = length(pos.xz) - uPillarWidth;
                    fieldDistance = blendMax(radialBound, fieldDistance, 1.0);
                    fieldDistance = abs(fieldDistance) * 0.15 + 0.01;

                    vec3 gradient = mix(uBottomColor, uTopColor, smoothstep(15.0, -15.0, pos.y));
                    color += gradient * pow(1.0 / fieldDistance, 1.0);

                    if(fieldDistance < EPSILON || depth > maxDepth) break;
                    depth += fieldDistance;
                }

                float widthNormalization = uPillarWidth / 3.0;
                color = tanh(color * uGlowAmount / widthNormalization);
                
                float rnd = noise(gl_FragCoord.xy);
                color -= rnd / 15.0 * uNoiseIntensity;
                
                gl_FragColor = vec4(color * uIntensity, 1.0);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(width, height) },
                uMouse: { value: new THREE.Vector2(0, 0) },
                uTopColor: { value: parseColor(this.options.topColor) },
                uBottomColor: { value: parseColor(this.options.bottomColor) },
                uIntensity: { value: this.options.intensity },
                uInteractive: { value: this.options.interactive },
                uGlowAmount: { value: this.options.glowAmount },
                uPillarWidth: { value: this.options.pillarWidth },
                uPillarHeight: { value: this.options.pillarHeight },
                uNoiseIntensity: { value: this.options.noiseIntensity },
                uPillarRotation: { value: this.options.pillarRotation }
            },
            transparent: true,
            depthWrite: false,
            depthTest: false
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);

        // Interaction
        if (this.options.interactive) {
            this.handleMouseMove = e => {
                const rect = this.container.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                this.mouse.x = x;
                this.mouse.y = y;
            };
            window.addEventListener('mousemove', this.handleMouseMove);
        }

        // Resize
        this.handleResize = () => {
            const newWidth = this.container.clientWidth;
            const newHeight = this.container.clientHeight;
            this.renderer.setSize(newWidth, newHeight);
            this.material.uniforms.uResolution.value.set(newWidth, newHeight);
        };
        window.addEventListener('resize', this.handleResize);
    }

    startAnimation() {
        if (this.animationId) return;
        const animate = currentTime => {
            this.animationId = requestAnimationFrame(animate);
            if (!this.renderer || !this.material || !this.scene || !this.camera) return;

            const deltaTime = currentTime - this.lastTime;

            if (deltaTime >= this.frameTime) {
                this.time += 0.016 * this.options.rotationSpeed;
                this.material.uniforms.uTime.value = this.time;

                if (this.options.interactive) {
                    this.material.uniforms.uMouse.value.set(this.mouse.x, this.mouse.y);
                }

                this.renderer.render(this.scene, this.camera);
                this.lastTime = currentTime - (deltaTime % this.frameTime);
            }
        };
        this.animationId = requestAnimationFrame(animate);
    }

    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    destroy() {
        this.stopAnimation();
        this.observer.disconnect();
        window.removeEventListener('resize', this.handleResize);
        if (this.handleMouseMove) {
            window.removeEventListener('mousemove', this.handleMouseMove);
        }
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
        if (this.material) this.material.dispose();
    }
}
