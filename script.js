    let canvas = document.getElementById('canvas');
        let ctx = canvas.getContext('2d');
        let currentLimit = 50000;
        let currentWidth = 500;
        let currentColor = '#4CAF50';
        let zoom = 1;
        let offsetX = 0;
        let offsetY = 0;
        let isDragging = false;
        let lastX = 0;
        let lastY = 0;
        let isUlamSpiral = false;
        let primeCache = null;

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            if (primeCache) {
                drawFromCache();
            }
        }

        document.getElementById('limit').addEventListener('input', function(e) {
            currentLimit = parseInt(e.target.value);
            document.getElementById('limitValue').textContent = formatNumber(currentLimit);
            document.getElementById('totalNumbers').textContent = formatNumber(currentLimit);
            primeCache = null;
        });

        document.getElementById('width').addEventListener('input', function(e) {
            currentWidth = parseInt(e.target.value);
            document.getElementById('widthValue').textContent = currentWidth;
            primeCache = null;
        });

        document.getElementById('color').addEventListener('input', function(e) {
            currentColor = e.target.value;
            document.getElementById('colorPreview').style.background = currentColor;
            if (primeCache) {
                drawFromCache();
            }
        });

        function formatNumber(num) {
            return num.toLocaleString();
        }

        function isPrime(num) {
            if (num <= 1) return false;
            if (num <= 3) return true;
            if (num % 2 === 0 || num % 3 === 0) return false;
            
            let i = 5;
            while (i * i <= num) {
                if (num % i === 0 || num % (i + 2) === 0) return false;
                i += 6;
            }
            return true;
        }

        function sieveOfEratosthenes(limit) {
            const start = performance.now();
            const primes = new Array(limit + 1).fill(true);
            primes[0] = primes[1] = false;
            
            const sqrtLimit = Math.sqrt(limit);
            for (let i = 2; i <= sqrtLimit; i++) {
                if (primes[i]) {
                    for (let j = i * i; j <= limit; j += i) {
                        primes[j] = false;
                    }
                }
            }
            
            return {
                primes: primes,
                time: performance.now() - start
            };
        }

        function generateUlamSpiral(limit) {
            const startTime = performance.now();
            const size = Math.ceil(Math.sqrt(limit)) * 2;
            const center = Math.floor(size / 2);
            const grid = new Array(size * size).fill(false);
            
            let x = center;
            let y = center;
            let dir = 0;
            let step = 1;
            let stepsTaken = 0;
            let stepChange = 0;
            let primeCount = 0;
            
            for (let num = 1; num <= limit; num++) {
                const index = y * size + x;
                
                if (isPrime(num)) {
                    grid[index] = true;
                    primeCount++;
                }
                
                switch(dir) {
                    case 0: x++; break;
                    case 1: y--; break;
                    case 2: x--; break;
                    case 3: y++; break;
                }
                
                stepsTaken++;
                if (stepsTaken === step) {
                    stepsTaken = 0;
                    dir = (dir + 1) % 4;
                    stepChange++;
                    if (stepChange === 2) {
                        step++;
                        stepChange = 0;
                    }
                }
            }
            
            return {
                grid: grid,
                size: size,
                center: center,
                primeCount: primeCount,
                time: performance.now() - startTime
            };
        }

        function generatePrimes() {
            const limit = currentLimit;
            
            document.getElementById('loading').style.display = 'block';
            
            setTimeout(() => {
                const startTime = performance.now();
                
                if (isUlamSpiral) {
                    const spiral = generateUlamSpiral(limit);
                    primeCache = spiral;
                    drawUlamSpiral(spiral);
                    updateStats(limit, spiral.primeCount, spiral.time);
                } else {
                    const sieveResult = sieveOfEratosthenes(limit);
                    const primes = sieveResult.primes;
                    
                    let primeCount = 0;
                    for (let i = 2; i <= limit; i++) {
                        if (primes[i]) primeCount++;
                    }
                    
                    primeCache = { primes: primes, primeCount: primeCount };
                    drawGrid(primes, limit);
                    updateStats(limit, primeCount, sieveResult.time);
                }
                
                document.getElementById('loading').style.display = 'none';
            }, 50);
        }

        function drawGrid(primes, limit) {
            const width = currentWidth;
            const height = Math.ceil(limit / width);
            
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const cellSize = Math.min(canvas.width / width, canvas.height / height);
            const startX = (canvas.width - width * cellSize * zoom) / 2 + offsetX;
            const startY = (canvas.height - height * cellSize * zoom) / 2 + offsetY;
            
            ctx.fillStyle = currentColor;
            
            for (let num = 2; num <= limit; num++) {
                if (primes[num]) {
                    const x = ((num - 1) % width) * cellSize;
                    const y = Math.floor((num - 1) / width) * cellSize;
                    
                    const screenX = startX + x * zoom;
                    const screenY = startY + y * zoom;
                    
                    if (screenX >= -cellSize && screenX <= canvas.width && 
                        screenY >= -cellSize && screenY <= canvas.height) {
                        ctx.fillRect(screenX, screenY, Math.max(1, cellSize * zoom), Math.max(1, cellSize * zoom));
                    }
                }
            }
        }

        function drawUlamSpiral(spiral) {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            const cellSize = Math.min(canvas.width, canvas.height) / spiral.size / zoom;
            const startX = canvas.width / 2 - spiral.center * cellSize * zoom + offsetX;
            const startY = canvas.height / 2 - spiral.center * cellSize * zoom + offsetY;
            
            ctx.fillStyle = currentColor;
            
            for (let y = 0; y < spiral.size; y++) {
                for (let x = 0; x < spiral.size; x++) {
                    if (spiral.grid[y * spiral.size + x]) {
                        const screenX = startX + x * cellSize * zoom;
                        const screenY = startY + y * cellSize * zoom;
                        
                        if (screenX >= -cellSize && screenX <= canvas.width && 
                            screenY >= -cellSize && screenY <= canvas.height) {
                            ctx.fillRect(screenX, screenY, Math.max(1, cellSize * zoom), Math.max(1, cellSize * zoom));
                        }
                    }
                }
            }
        }

        function drawFromCache() {
            if (!primeCache) return;
            
            if (isUlamSpiral) {
                drawUlamSpiral(primeCache);
            } else {
                drawGrid(primeCache.primes, currentLimit);
            }
        }

        function updateStats(total, primes, time) {
            document.getElementById('totalNumbers').textContent = formatNumber(total);
            document.getElementById('primesCount').textContent = formatNumber(primes);
            
            const percentage = ((primes / total) * 100).toFixed(2);
            document.getElementById('percentage').textContent = percentage + '%';
            
            document.getElementById('timeElapsed').textContent = time.toFixed(0) + 'ms';
        }

        function toggleUlamSpiral() {
            isUlamSpiral = !isUlamSpiral;
            const button = document.querySelector('button[onclick="toggleUlamSpiral()"]');
            button.textContent = isUlamSpiral ? 'Alternar Cuadrícula' : 'Alternar Espiral';
            primeCache = null;
            generatePrimes();
        }

        function zoomIn() {
            zoom *= 1.2;
            drawFromCache();
        }

        function zoomOut() {
            zoom /= 1.2;
            if (zoom < 0.1) zoom = 0.1;
            drawFromCache();
        }

        function resetZoom() {
            zoom = 1;
            offsetX = 0;
            offsetY = 0;
            drawFromCache();
        }

        canvas.addEventListener('mousedown', function(e) {
            isDragging = true;
            lastX = e.clientX;
            lastY = e.clientY;
            canvas.style.cursor = 'grabbing';
        });

        canvas.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const deltaX = e.clientX - lastX;
                const deltaY = e.clientY - lastY;
                
                offsetX += deltaX;
                offsetY += deltaY;
                
                lastX = e.clientX;
                lastY = e.clientY;
                
                drawFromCache();
            }
        });

        canvas.addEventListener('mouseup', function() {
            isDragging = false;
            canvas.style.cursor = 'crosshair';
        });

        canvas.addEventListener('wheel', function(e) {
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            
            offsetX = mouseX - (mouseX - offsetX) * zoomFactor;
            offsetY = mouseY - (mouseY - offsetY) * zoomFactor;
            zoom *= zoomFactor;
            
            if (zoom < 0.1) zoom = 0.1;
            if (zoom > 20) zoom = 20;
            
            drawFromCache();
        });

        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('load', function() {
            resizeCanvas();
            document.getElementById('colorPreview').style.background = currentColor;
            generatePrimes();
        });