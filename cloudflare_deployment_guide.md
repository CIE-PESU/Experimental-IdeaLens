# Cloudflare Pages Deployment Guide

This document outlines the steps to deploy your application to Cloudflare Pages and compares the available service tiers.

## 🚀 How to Deploy (Step-by-Step)

1.  **Direct Git Integration (Recommended)**: 
    - Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
    - Navigate to **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
    - Select your GitHub/GitLab repository.
2.  **Configure Build Settings**:
    - **Framework Preset**: Next.js (Static export).
    - **Build Command**: `npm run build`
    - **Build Output Directory**: `out`
3.  **Deploy**: 
    - Click **Save and Deploy**. Cloudflare will automatically build and host your site on its global edge network.

---

## 💎 Free vs. Pro Tier Comparison

| Feature | Free Tier | Pro Tier ($20/mo) |
| :--- | :--- | :--- |
| **Builds per Month** | 500 builds | 5,000 builds |
| **Concurrent Builds**| 1 build at a time | 5 builds at a time |
| **Downtime Risk** | Standard | **Lower** (Advanced Mitigation) |
| **Security (WAF)** | Basic (5 rules) | **Advanced (20+ rules)** |
| **Edge Network** | Global | Global (Prioritized Routing) |
| **Support** | Community | **Ticket-based (Faster)** |

### 🛑 Is there any downtime?
*   **Static Sites**: Cloudflare Pages is a "Serverless" architecture. Your code is distributed across hundreds of data centers. Even if one server goes down, another takes over instantly. **Downtime for static content is effectively zero.**
*   **Pro Advantage**: The Pro tier adds a more robust **Web Application Firewall (WAF)** and Bot Management. This protects your app from malicious traffic spikes (DDoS attacks) that could otherwise slow down or temporarily block your site on the Free tier.

---

## ✅ Summary for Management
For internal tools and prototypes, the **Free Tier** is highly capable. However, as the project scales or handles sensitive jury data, upgrading to the **Pro Tier** ($20/month) is recommended for **higher build limits**, **faster updates**, and **advanced protection** against availability-threatening attacks.
