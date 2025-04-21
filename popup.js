document.getElementById("extract").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        chrome.tabs.sendMessage(tab.id, { action: "getOrderInfo" }, (response) => {
            if (!response) {
                alert("Could not extract order info. Make sure you're on the correct page.");
                return;
            }

            const orderData = response;
            const priceString = parseFloat(orderData.shippingPrice.replace(',', '.').replace(/[^0-9.]/g, ''));
            chrome.storage.local.get(["apiKey", "logoUrl", "fromAddress"], async ({ apiKey, logoUrl, fromAddress }) => {
                if (!apiKey) {
                    alert("API key not set. Please enter it in the settings.");
                    return;
                }
                
                const invoiceData = {
                    logo: logoUrl || "",
                    from: fromAddress || "",
                    to: `${orderData.buyer.name}\n${orderData.buyer.street}\n${orderData.buyer.city}\n${orderData.buyer.country}`,
                    shipping: 0,
                    number: orderData.orderId,
                    items: orderData.articles.map((a) => ({
                        name: a.name,
                        quantity: parseInt(a.quantity),
                        unit_cost: parseFloat(a.price.replace(",", ".")),
                    })),
                    notes: `Auto-generated invoice for Cardmarket Order #${orderData.orderId}`,
                    currency: "EUR",
                    header: "Delivery Note",
                    balance_title: "Paid",
                    fields: {
                        shipping: true
                    },
                    shipping: priceString,
                    to_title: "Ship To"
                };

                try {
                    const response = await fetch("https://invoice-generator.com", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiKey}`
                        },
                        body: JSON.stringify(invoiceData),
                    });

                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    window.open(url);
                } catch (err) {
                    console.error("Invoice generation failed:", err);
                    alert("Failed to generate invoice.");
                }
            });
        });
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const keyInput = document.getElementById("apikey");
    const logoInput = document.getElementById("logoUrl");
    const fromAddressInput = document.getElementById("fromAddress");
    const saveBtn = document.getElementById("save");
    const statusText = document.getElementById("status");
    const logoPreview = document.getElementById("logoPreview");

    // Load saved settings
    chrome.storage.local.get(["apiKey", "logoUrl", "fromAddress"], (result) => {
        keyInput.value = result.apiKey || "";
        logoInput.value = result.logoUrl || "";
        fromAddressInput.value = result.fromAddress || "";

        if (result.logoUrl) {
            logoPreview.src = result.logoUrl;
            logoPreview.style.display = "block";
        }
    });

    // Save settings
    saveBtn.addEventListener("click", () => {
        const apiKey = keyInput.value.trim();
        const logoUrl = logoInput.value.trim();
        const fromAddress = fromAddressInput.value.trim();

        chrome.storage.local.set({ apiKey, logoUrl, fromAddress }, () => {
            statusText.innerText = "Saved!";
            logoPreview.src = logoUrl;
            logoPreview.style.display = logoUrl ? "block" : "none";
            setTimeout(() => (statusText.innerText = ""), 2000);
        });
    });
});
