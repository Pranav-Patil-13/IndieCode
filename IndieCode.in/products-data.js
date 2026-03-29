const desktopHTML1 = `
<div class="mockup-body">
    <div style="display: flex; gap: 20px; height: 100%;">
        <div style="width: 25%; background: rgba(255,255,255,0.02); border-radius: 12px; padding: 20px; display: flex; flex-direction: column; gap: 15px;">
            <div style="margin-bottom: 20px;">
                <div class="mockup-line"></div>
                <div class="mockup-line medium"></div>
            </div>
            <div class="mockup-line"></div><div class="mockup-line medium"></div>
            <div class="mockup-line short"></div><div class="mockup-line medium"></div>
            <div class="mockup-line"></div>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; gap: 15px; flex: 1;">
                <div class="mockup-block"></div><div class="mockup-block"></div><div class="mockup-block"></div>
            </div>
            <div class="mockup-block" style="flex: 1.5; display: flex; flex-direction: column; gap: 15px; padding: 20px;">
                <div class="mockup-line"></div><div class="mockup-line medium"></div>
                <div class="mockup-line"></div><div class="mockup-line short"></div>
            </div>
        </div>
    </div>
</div>
`;

const tabletHTML1 = `
<div class="mockup-body">
    <div style="display: flex; flex-direction: column; gap: 15px; height: 100%;">
        <div style="display: flex; gap: 15px; height: 40px;">
            <div class="mockup-block" style="width: 40px; flex: none;"></div>
            <div class="mockup-block"></div>
        </div>
        <div style="display: flex; gap: 15px; flex: 1;">
            <div class="mockup-block" style="flex: 1;"></div>
            <div class="mockup-block" style="flex: 1;"></div>
        </div>
        <div class="mockup-block" style="flex: 1.5; padding: 15px;">
            <div class="mockup-line"></div><div class="mockup-line medium"></div>
        </div>
    </div>
</div>
`;

const mobileHTML1 = `
<div class="mockup-body">
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
        <div class="mockup-block" style="width: 40px; height: 40px; flex: none; border-radius: 50%;"></div>
        <div style="flex: 1;">
            <div class="mockup-line" style="margin-bottom: 8px;"></div>
            <div class="mockup-line short"></div>
        </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 12px; flex: 1;">
        <div class="mockup-block" style="min-height: 80px;"></div>
        <div class="mockup-block" style="min-height: 80px;"></div>
        <div class="mockup-block" style="min-height: 80px;"></div>
    </div>
</div>
`;

const desktopHTML2 = `
<div class="mockup-body" style="padding: 20px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div class="mockup-line" style="width: 150px;"></div>
        <div style="display: flex; gap: 10px;">
            <div class="mockup-line" style="width: 50px;"></div>
            <div class="mockup-line" style="width: 30px; border-radius: 50%;"></div>
        </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; flex: 1;">
        <div class="mockup-block" style="padding: 0; display: flex; flex-direction: column; overflow: hidden;">
            <div style="height: 120px; background: rgba(255,255,255,0.05);"></div>
            <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px;">
                <div class="mockup-line"></div><div class="mockup-line short"></div>
            </div>
        </div>
        <div class="mockup-block" style="padding: 0; display: flex; flex-direction: column; overflow: hidden;">
            <div style="height: 120px; background: rgba(255,255,255,0.04);"></div>
            <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px;">
                <div class="mockup-line"></div><div class="mockup-line short"></div>
            </div>
        </div>
        <div class="mockup-block" style="padding: 0; display: flex; flex-direction: column; overflow: hidden;">
            <div style="height: 120px; background: rgba(255,255,255,0.06);"></div>
            <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px;">
                <div class="mockup-line"></div><div class="mockup-line short"></div>
            </div>
        </div>
    </div>
</div>
`;

const tabletHTML2 = `
<div class="mockup-body" style="padding: 15px;">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <div class="mockup-line" style="width: 100px;"></div>
        <div class="mockup-line" style="width: 30px; border-radius: 50%;"></div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; flex: 1;">
        <div class="mockup-block" style="padding: 0; display: flex; flex-direction: column; overflow: hidden;">
            <div style="height: 80px; background: rgba(255,255,255,0.05);"></div>
            <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div class="mockup-line"></div><div class="mockup-line short"></div>
            </div>
        </div>
        <div class="mockup-block" style="padding: 0; display: flex; flex-direction: column; overflow: hidden;">
            <div style="height: 80px; background: rgba(255,255,255,0.04);"></div>
            <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div class="mockup-line"></div><div class="mockup-line short"></div>
            </div>
        </div>
        <div class="mockup-block" style="padding: 0; display: flex; flex-direction: column; overflow: hidden;">
            <div style="height: 80px; background: rgba(255,255,255,0.06);"></div>
            <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div class="mockup-line"></div><div class="mockup-line short"></div>
            </div>
        </div>
        <div class="mockup-block" style="padding: 0; display: flex; flex-direction: column; overflow: hidden;">
            <div style="height: 80px; background: rgba(255,255,255,0.03);"></div>
            <div style="padding: 12px; display: flex; flex-direction: column; gap: 8px;">
                <div class="mockup-line"></div><div class="mockup-line short"></div>
            </div>
        </div>
    </div>
</div>
`;

const mobileHTML2 = `
<div class="mockup-body">
    <div class="mockup-block" style="padding: 0; display: flex; flex-direction: column; overflow: hidden; min-height: 180px; margin-bottom: 12px;">
        <div style="flex: 1; background: rgba(255,255,255,0.05);"></div>
        <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px;">
            <div class="mockup-line"></div><div class="mockup-line short"></div>
        </div>
    </div>
    <div class="mockup-block" style="padding: 0; display: flex; flex-direction: column; overflow: hidden; min-height: 180px;">
        <div style="flex: 1; background: rgba(255,255,255,0.04);"></div>
        <div style="padding: 15px; display: flex; flex-direction: column; gap: 10px;">
            <div class="mockup-line"></div><div class="mockup-line short"></div>
        </div>
    </div>
</div>
`;

const desktopHTML3 = `
<div class="mockup-body" style="padding: 0; display: flex;">
    <div style="width: 280px; background: rgba(255,255,255,0.02); border-right: 1px solid rgba(255,255,255,0.05); padding: 20px; display: flex; flex-direction: column; gap: 15px;">
        <div class="mockup-line"></div>
        <div class="mockup-block" style="min-height: 60px;"></div>
        <div class="mockup-block" style="min-height: 60px;"></div>
        <div class="mockup-block" style="min-height: 60px;"></div>
    </div>
    <div style="flex: 1; position: relative;">
        <!-- Desktop Map area mockup -->
        <div style="position: absolute; inset: 0; background: rgba(66, 133, 244, 0.05);">
            <div style="position: absolute; top: 40%; left: 40%; width: 20px; height: 20px; background: #7baaf7; border-radius: 50%; border: 4px solid rgba(66, 133, 244, 0.3);"></div>
            <div style="position: absolute; top: 30%; left: 30%; width: 120px; height: 3px; background: rgba(123, 170, 247, 0.4); transform: rotate(45deg);"></div>
            <div style="position: absolute; top: 60%; left: 60%; width: 18px; height: 18px; background: #fff; border-radius: 50%; border: 4px solid #2a2e35;"></div>
        </div>
    </div>
</div>
`;

const tabletHTML3 = `
<div class="mockup-body" style="padding: 0; display: flex; flex-direction: column;">
    <div style="flex: 1; position: relative;">
        <!-- Tablet Map area mockup -->
        <div style="position: absolute; inset: 0; background: rgba(66, 133, 244, 0.05);">
            <div style="position: absolute; top: 50%; left: 50%; width: 16px; height: 16px; background: #7baaf7; border-radius: 50%; border: 3px solid rgba(66, 133, 244, 0.3);"></div>
            <div style="position: absolute; top: 35%; left: 35%; width: 80px; height: 2px; background: rgba(123, 170, 247, 0.4); transform: rotate(45deg);"></div>
        </div>
    </div>
    <div style="height: 120px; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); padding: 15px; display: flex; gap: 15px; overflow: hidden;">
        <div class="mockup-block" style="min-width: 140px;"></div>
        <div class="mockup-block" style="min-width: 140px;"></div>
        <div class="mockup-block" style="min-width: 140px;"></div>
    </div>
</div>
`;

const mobileHTML3 = `
<div class="mockup-body" style="padding: 0; display: flex; flex-direction: column;">
    <!-- Map area mockup -->
    <div style="flex: 1; background: rgba(66, 133, 244, 0.08); position: relative;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 14px; height: 14px; background: #7baaf7; border-radius: 50%; border: 3px solid rgba(66, 133, 244, 0.3);"></div>
        <div style="position: absolute; top: 30%; left: 30%; width: 50px; height: 2px; background: rgba(123, 170, 247, 0.4); transform: rotate(45deg);"></div>
    </div>
    
    <div style="background: rgba(15,19,24,0.9); border-top-left-radius: 20px; border-top-right-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 12px; margin-top: -20px; position: relative; z-index: 2;">
        <div style="width: 40px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin: 0 auto 10px;"></div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 15px;">
            <div class="mockup-line" style="margin-bottom: 8px;"></div>
            <div class="mockup-line short"></div>
        </div>
        <div style="background: rgba(255,255,255,0.04); border-radius: 12px; padding: 15px;">
            <div class="mockup-line" style="margin-bottom: 8px;"></div>
            <div class="mockup-line medium"></div>
        </div>
    </div>
</div>
`;
const desktopHTML4 = `
<div class="mockup-body" style="padding: 0;">
    <div style="height: 60px; background: rgba(255,255,255,0.02); border-bottom: 1px solid rgba(255,255,255,0.05); padding: 0 30px; display: flex; align-items: center; justify-content: space-between;">
        <div class="mockup-line" style="width: 100px;"></div>
        <div style="display: flex; gap: 20px;">
            <div class="mockup-line" style="width: 60px;"></div>
            <div class="mockup-line" style="width: 60px;"></div>
        </div>
    </div>
    <div style="padding: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div class="mockup-block" style="aspect-ratio: 1; opacity: 0.1;"></div>
        <div style="display: flex; flex-direction: column; gap: 20px; padding-top: 20px;">
            <div class="mockup-line" style="height: 30px; width: 80%;"></div>
            <div class="mockup-line" style="height: 20px; width: 40%; background: #e3ca8c; opacity: 0.3;"></div>
            <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
                <div class="mockup-line"></div>
                <div class="mockup-line"></div>
                <div class="mockup-line medium"></div>
            </div>
            <div class="mockup-block" style="height: 50px; margin-top: 20px; border-radius: 30px;"></div>
        </div>
    </div>
</div>
`;

const tabletHTML4 = `
<div class="mockup-body">
    <div style="display: flex; flex-direction: column; gap: 20px;">
        <div class="mockup-block" style="aspect-ratio: 1.5; opacity: 0.08;"></div>
        <div style="display: flex; flex-direction: column; gap: 15px;">
            <div class="mockup-line" style="height: 25px; width: 70%;"></div>
            <div class="mockup-line" style="height: 15px; width: 30%; background: #e3ca8c; opacity: 0.2;"></div>
            <div class="mockup-block" style="height: 45px; border-radius: 25px; margin-top: 10px;"></div>
        </div>
    </div>
</div>
`;

const mobileHTML4 = `
<div class="mockup-body">
    <div class="mockup-block" style="aspect-ratio: 1; margin-bottom: 20px; opacity: 0.05;"></div>
    <div class="mockup-line" style="height: 20px; width: 80%; margin-bottom: 12px;"></div>
    <div class="mockup-line short" style="margin-bottom: 24px;"></div>
    <div class="mockup-block" style="height: 50px; border-radius: 25px;"></div>
</div>
`;

const productsData = {
    "corporate-intranet": {
        badgeText: "Custom Build",
        badgeClass: "badge-custom",
        title: "Corporate Intranet",
        description: "A highly secure, multi-tenant portal designed for robust internal communications, file sharing, and HR workflows. Built for enterprise-scale operations with zero compromise on user experience.",
        meta1Label: "Timeline",
        meta1Value: "18 Days",
        meta2Label: "Client Segment",
        meta2Value: "Global Enterprise",
        meta3Label: "Core Tech",
        meta3Value: "Next.js, Node.js, PostgreSQL",
        actionText: "Request Similar Project",
        price: 649900, // INR 6,499 in paise
        actionLink: "index.html#contact",
        checkoutLink: "razorpay", 
        glowColor: "rgba(66, 133, 244, 0.15)",
        desktopImage: "assets/intranet-desktop.png",
        tabletImage: "",
        mobileImage: "",
        desktopSkeleton: desktopHTML1,
        tabletSkeleton: tabletHTML1,
        mobileSkeleton: mobileHTML1
    },
    "modern-lms-platform": {
        badgeText: "Ready Product",
        badgeClass: "badge-ready",
        title: "Modern LMS Platform",
        description: "A fully featured Learning Management System that teams can brand, launch, and monetize in less than a week. Delivering courses securely without sacrificing performance.",
        meta1Label: "Deployment Time",
        meta1Value: "< 1 Week",
        meta2Label: "License Type",
        meta2Value: "Full Code Buyout",
        meta3Label: "Core Tech",
        meta3Value: "React, Node.js, AWS",
        actionText: "Buy & Brand Now",
        price: 649900, // INR 6,499 in paise
        actionLink: "index.html#contact",
        checkoutLink: "razorpay", 
        glowColor: "rgba(155, 81, 224, 0.15)",
        desktopImage: "assets/lms-desktop.png",
        tabletImage: "assets/lms-tablet.png",
        mobileImage: "assets/lms-mobile.png",
        desktopSkeleton: desktopHTML2,
        tabletSkeleton: tabletHTML2,
        mobileSkeleton: mobileHTML2
    },
    "train-navigation-app": {
        badgeText: "Custom Build",
        badgeClass: "badge-custom",
        title: "Train Navigation App",
        description: "An intelligent route-optimization algorithm wrapped in a consumer-friendly mobile web experience. Predicting delays and simplifying daily commutes seamlessly.",
        meta1Label: "Timeline",
        meta1Value: "30 Days",
        meta2Label: "Target Audience",
        meta2Value: "Daily Commuters",
        meta3Label: "Core Tech",
        meta3Value: "Vue.js, Python, GIS data",
        actionText: "Request Mobile App",
        actionLink: "index.html#contact",
        checkoutLink: "#",
        glowColor: "rgba(66, 133, 244, 0.1)",
        desktopImage: "assets/train-desktop.png",
        tabletImage: "",
        mobileImage: "",
        desktopSkeleton: desktopHTML3,
        tabletSkeleton: tabletHTML3,
        mobileSkeleton: mobileHTML3
    },
    "puregrains": {
        badgeText: "Ready Product",
        badgeClass: "badge-ready",
        title: "PureGrains Store",
        description: "A premium direct-to-consumer e-commerce engine optimized for regional grains. Features advanced subscription management, moisture-sealed packaging logistics tracking, and wholesale bulk order capabilities.",
        meta1Label: "Build Cycle",
        meta1Value: "17 Days",
        meta2Label: "Niche",
        meta2Value: "Organic Agri-Retail",
        meta3Label: "Core Tech",
        meta3Value: "Next.js, Tailwind, Stripe",
        actionText: "Buy License",
        price: 649900, // INR 6,499 in paise
        actionLink: "index.html#contact",
        checkoutLink: "razorpay", 
        glowColor: "rgba(227, 202, 140, 0.12)",
        desktopImages: ["assets/puregrains-desktop.png"],
        tabletImage: "assets/puregrains-tab.png",
        mobileImage: "assets/puregrains-mobile.png",
        desktopSkeleton: desktopHTML4,
        tabletSkeleton: tabletHTML4,
        mobileSkeleton: mobileHTML4
    }
};
