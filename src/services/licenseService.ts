// services/licenseService.ts
// License 激活双写：本侧 = Backend，对侧 = CSM。
// 错误处理规则（已确认）：
//   - 本侧（Backend）失败 → 返回 false，由界面提示
//   - 对侧（CSM）失败 → 重试一次，仍失败仅 console 提示，不在界面提示
//   - 对侧 API 未配置 → 不调用，console.warn
import axios from "axios";
import config from "../config";

/** 带重试的调用：返回 true=成功，false=失败（已重试）。 */
async function callWithRetry(fn: () => Promise<any>, retries = 1): Promise<boolean> {
   for (let i = 0; i <= retries; i++) {
      try {
         await fn();
         return true;
      } catch (e) {
         if (i === retries) return false;
      }
   }
   return false;
}

/**
 * 激活授权码：分别调用 Backend 与 CSM 两侧的激活接口。
 * @returns { backend: boolean; csm: 'skipped' | 'ok' | 'failed' }
 */
export async function activateLicense(licenseCode: string) {
   const body = { licenseCode };

   // 本侧：Backend（界面提示由调用方处理）
   const backendOk = await callWithRetry(() =>
      axios.post(`${config.backend.url}/v1/license/update-license-code`, body)
   );

   // 对侧：CSM（失败仅 console）
   const csmBase = config.csm.http_url;
   let csm: "skipped" | "ok" | "failed" = "skipped";
   if (csmBase) {
      const token = sessionStorage.getItem("token") || localStorage.getItem("token");
      const headers: Record<string, string> = { "X-License-Sync-Source": "web" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const csmOk = await callWithRetry(() =>
         axios.post(`${csmBase}/license/update-license-code`, body, { headers })
      );
      csm = csmOk ? "ok" : "failed";
      if (!csmOk) {
         console.error("[License] CSM 侧激活失败（已重试）");
      }
   } else {
      console.warn("[License] CSM HTTP API 未配置，跳过对侧激活同步");
   }

   return { backend: backendOk, csm };
}