 async function main() {
      await liff.init({ liffId: "2008825433-EiKVRQPf" });
      if (!liff.isLoggedIn()) {
        liff.login();
      } else {
        const profile = await liff.getProfile();
        const idToken = liff.getIDToken(); // 取得 ID Token
        // 傳送給 n8n
        await fetch("https://lumpier-odessa-distinguishingly.ngrok-free.dev/webhook-test/skin-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: profile.userId,
            displayName: profile.displayName,
            idToken: idToken 
          })
        });
        // alert("資料已傳送至 n8n！");
        // liff.closeWindow(); // 關閉 LIFF 視窗
      }
    }
    main();
