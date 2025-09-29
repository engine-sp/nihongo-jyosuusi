const mainCanvas = document.getElementById('backgroundCanvas');
const mainCtx = mainCanvas.getContext('2d');

// --- (1) 單位型設定 (新增 CELL_SIZE) ---
const PATTERN_SIZE = 500; 
const ICON_SIZE = 20;     // Icon 的字體大小 (實際繪製大小)
const CELL_SIZE = (PATTERN_SIZE / 12);     // <--- 新增：每個 Icon 所佔的網格間距 (包含留白)

// --- (2) 動畫狀態變數 ---
let pattern;            // 儲存建立的 CanvasPattern 物件
let offsetX = 0;
let offsetY = 0;
const ANIMATION_SPEED = 0.2; // 每幀移動的像素數
let ICON_CHARACTERS = []; // <--- 改為動態載入
const FONT_COLOR = 'rgba(100, 100, 100, 0.2)'; 

// ----------------------------------------------------
// A. 建立單位型 Canvas (只執行一次)
// ----------------------------------------------------

function createPatternCanvas() {
    // 建立一個隱藏的 Canvas 來作為 Pattern 的來源
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = PATTERN_SIZE;
    patternCanvas.height = PATTERN_SIZE;
    const ptx = patternCanvas.getContext('2d');

    // 設定繪圖樣式
    // 保持字體大小為 ICON_SIZE，但 CELL_SIZE 決定了間隔
    ptx.font = `${ICON_SIZE}px sans-serif`;
    ptx.fillStyle = FONT_COLOR;
    ptx.textAlign = 'center'; 
    ptx.textBaseline = 'middle'; 

    // 繪製 Icon 網格到單位型 Canvas 上
    // 注意：網格數量現在由 PATTERN_SIZE / CELL_SIZE 決定
    const cols = PATTERN_SIZE / CELL_SIZE;
    const rows = PATTERN_SIZE / CELL_SIZE;
    const prime = 10007;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            
            // 選擇固定 Icon 種類
            const iconSeed = Math.abs(i * prime + j); 
            const selectedIcon = ICON_CHARACTERS[iconSeed % ICON_CHARACTERS.length];

            // 繪製 Icon 座標計算：
            // 1. j * CELL_SIZE 是網格的左上角 (例如：40, 80, 120...)
            // 2. + CELL_SIZE / 2 是網格的中心點 (例如：20, 60, 100...)
            const x = j * CELL_SIZE + CELL_SIZE / 2;
            const y = i * CELL_SIZE + CELL_SIZE / 2;
            
            ptx.fillText(selectedIcon, x, y);
        }
    }
    
    // 將這個繪製好的單位型 Canvas 轉換為 Pattern 物件
    pattern = mainCtx.createPattern(patternCanvas, 'repeat');
}


// ----------------------------------------------------
// B. 主 Canvas 尺寸調整與動畫
// ----------------------------------------------------

function resizeCanvas() {
    mainCanvas.width = window.innerWidth;
    mainCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas); 


function drawBackground() {
    mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    
    // 1. 更新偏移量
    // 偏移量不斷增加，並在達到 PATTERN_SIZE 時重置為 0，實現週期性循環
    offsetX = (offsetX + ANIMATION_SPEED) % PATTERN_SIZE; 
    offsetY = (offsetY + ANIMATION_SPEED / 2) % PATTERN_SIZE; 
    
    // 2. 設置 Pattern 填充
    if (pattern) {
        // 設定 Canvas 變換矩陣，實現 Pattern 的「移動」
        // translate(-offsetX, -offsetY) 讓 Pattern 內容看起來像是向右下方移動
        mainCtx.translate(offsetX, offsetY); 
        
        // 3. 填充整個畫面
        mainCtx.fillStyle = pattern;
        mainCtx.fillRect(-offsetX, -offsetY, 
                         mainCanvas.width + offsetX, mainCanvas.height + offsetY);
        
        // 4. 重置變換矩陣，確保下一個繪圖操作從 (0, 0) 開始
        mainCtx.setTransform(1, 0, 0, 1, 0, 0); 
    }

    // 建立動畫循環
    requestAnimationFrame(animate); 
}


// ----------------------------------------------------
// C. 啟動程序
// ----------------------------------------------------

function animate() {
    drawBackground();
}

function initializeBackground() {
    fetch('jyosuushi.json')
        .then(response => {
            if (!response.ok) {
                throw new Error("讀取 jyosuushi.json 失敗。");
            }
            return response.json();
        })
        .then(data => {
            // 1. 提取所有 icon
            const allIcons = Object.values(data.counters).flatMap(cat => cat.icon);
            
            // 2. 去除重複並隨機排序
            const uniqueIcons = [...new Set(allIcons)];
            ICON_CHARACTERS = uniqueIcons.sort(() => 0.5 - Math.random());

            // 3. 啟動動畫
            createPatternCanvas();
            resizeCanvas(); 
            animate();
        })
        .catch(error => {
            console.error("背景初始化失敗:", error);
            // Fallback with a simple icon array if fetch fails
            ICON_CHARACTERS = ['■', '▲', '●'];
            createPatternCanvas();
            resizeCanvas(); 
            animate();
        });
}

// 啟動程序
initializeBackground();