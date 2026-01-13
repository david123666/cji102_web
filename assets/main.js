import liff from '@line/liff';

// 配置資訊
const CONFIG = {
    liffId: "2008825433-EiKVRQPf",
    apiUrl: "./api/analyze.php"
};

async function initLiffApp() {
    try {
        await liff.init({ liffId: CONFIG.liffId });

        if (!liff.isLoggedIn()) {
            liff.login({ redirectUri: window.location.href });
            return;
        }

        // 已登入，執行業務邏輯
        const profile = await liff.getProfile();
        console.log("Success: ", profile.userId);

        // 更新 UI
        updateUserUI(profile);

        // 傳送資料到後端
        await syncUserToBackend(profile.userId);

    } catch (err) {
        console.error("LIFF 初始化失敗:", err);
        toast("LINE 初始化失敗，請從 LINE 開啟");
    }
}

async function syncUserToBackend(userId) {
    // 使用你寫好的 safeJsonFetch 工具
    const result = await safeJsonFetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_user_id: userId })
    });
    
    if (result.ok) {
        console.log("後端同步成功");
    }
}

function updateUserUI(profile) {
    const container = document.getElementById("user-profile-container");
    if (container) {
        container.innerHTML = `<h3>你好, ${profile.displayName}</h3>`;
    }
}

// 啟動程式
document.addEventListener('DOMContentLoaded', initLiffApp);
