/**
 * analyze.js - 前端模擬 AI 分析邏輯
 * 專為 GitHub Pages 等靜態環境設計
 */

/**
 * analyze.js - 串接 n8n API 版
 */

// ------- 配置 n8n Webhook 網址 -------
// 請將此處替換為你在 n8n 設定的 Production Webhook URL
const N8N_WEBHOOK_URL = "https://lumpier-odessa-distinguishingly.ngrok-free.dev/webhook-test/skin-analysis1";
// ------- 全域變數與初始化 -------
const toastEl = document.getElementById("toast");
const video = document.getElementById("video");
const cameraBox = document.getElementById("cameraBox");
const captureBtn = document.getElementById("captureBtn");
const canvas = document.getElementById("canvas");
const flash = document.getElementById("flash");

let stream = null;
let busy = false;

// ------- 提示訊息函數 -------
function toast(msg) {
    if (!toastEl) return alert(msg);
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 2200);
}

// ------- 相機控制 -------
async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
        toast("此瀏覽器不支援相機，請使用 HTTPS 環境開啟");
        return;
    }
    try {
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        video.srcObject = stream;
        
        // 等待影片 metadata 載入完成
        await new Promise((resolve) => {
            video.onloadedmetadata = () => resolve();
        });
        
        await video.play();
    } catch (err) {
        console.error("相機啟動失敗:", err);
        toast("無法開啟相機，請檢查權限設定");
    }
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// ------- 拍照閃光效果 -------
function flashOnce() {
    if (!flash) return;
    flash.style.opacity = "1";
    setTimeout(() => flash.style.opacity = "0", 120);
}

// ------- 核心拍照與分析邏輯 -------
captureBtn.addEventListener("click", async () => {
    if (busy || !stream) return;
    busy = true;
    cameraBox.classList.add("loading");

    try {
        // 1. 擷取畫面
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
        
        // 將照片轉為 Base64 字串 (品質 0.9)
        const photoBase64 = canvas.toDataURL("image/jpeg", 0.9);
        flashOnce();



        
        // // 2. 準備傳送到 n8n 的資料
        // const formData = new FormData();
        // formData.append("image", "capture.jpg");
        // // 如果有需要傳送其他欄位，例如 userID，可以在此加入
        // // formData.append("userId", "user_123");

        // // 3. 發送請求至 n8n
        // const response = await fetch(N8N_WEBHOOK_URL, {
        //     method: "POST",
        //     body: formData, // 使用 FormData 會自動處理 Content-Type: multipart/form-data
        // });

        // if (!response.ok) throw new Error("伺服器回應錯誤");

        // // 4. 接收 n8n 回傳的分析結果
        // // 假設 n8n 回傳的 JSON 結構與你原本的 payload 格式相同
        // const n8nResult = await response.json();


        



        
        // 2. 模擬 AI 運算時間 (1.5秒)
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 3. 隨機產生分析數據
        const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const metrics = {
            glow: r(65, 95),
            complexion: r(60, 92),
            blemish: r(55, 88),
            oilBalance: r(50, 90),
            evenness: r(60, 90)
        };

        const overall = Math.round(Object.values(metrics).reduce((a, b) => a + b) / 5);

        // 4. 定義結果內容
        const tag = overall >= 85 ? '狀態極佳' : (overall >= 75 ? '整體良好' : '可再提升');
        const skinType = metrics.oilBalance < 60 ? '偏乾 / 缺水型' : '混合偏穩定';

        const payload = {
            ok: true,
            photo_url: photoBase64,
            overall: overall,
            tag: tag,
            skinType: skinType,
            metrics: metrics,
            summary: "分析完成！目前膚況整體穩定，建議維持規律作息與保濕習慣。",
            tips: [
                "維持每日飲水 2000cc 有助於提升肌膚光澤。",
                "建議定期去角質，讓保養品吸收更順暢。",
                "睡眠充足是改善氣色的關鍵指標。"
            ],
            products: [
                { name: "保濕賦活精華", desc: "高效深層補水，改善乾燥。", tag: "熱銷", url: "#" },
                { name: "溫和淨化潔膚乳", desc: "低敏配方，洗後不緊繃。", tag: "基礎", url: "#" }
            ]
        };

        // 5. 儲存結果並跳轉
        localStorage.setItem("result", JSON.stringify(payload));
        stopCamera();
        window.location.href = "result.html";

    } catch (e) {
        console.error("分析錯誤:", e);
        toast("處理照片時發生錯誤");
    } finally {
        cameraBox.classList.remove("loading");
        busy = false;
    }
});

// ------- 頁面初始化與卸載 -------
openCamera();

window.addEventListener("beforeunload", stopCamera);
