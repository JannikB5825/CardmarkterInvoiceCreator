function extractOrderInfo() {
    const orderId = document.querySelector("h1")?.innerText?.match(/\d+/)?.[0];
    const buyerName = document.querySelector("#ShippingAddress .Name")?.innerText;
    const street = document.querySelector("#ShippingAddress .Street")?.innerText;
    const city = document.querySelector("#ShippingAddress .City")?.innerText;
    const country = document.querySelector("#ShippingAddress .Country")?.innerText;
    const shippingPrice = document.getElementsByClassName("shipping-price")[0]?.innerText;
  
    const timelineBoxes = document.querySelectorAll("#Timeline .timeline-box");
    const statusTimestamps = Array.from(timelineBoxes).map(box => box.innerText.trim());
  
    const articles = Array.from(document.querySelectorAll("tbody tr")).map(row => {
      return {
        name: row.querySelector('td.name a')?.innerText,
        quantity: row.getAttribute("data-amount"),
        price: row.getAttribute("data-price"),
        rarity: row.getAttribute("data-rarity"),
        condition: row.getAttribute("data-condition")
      };
    });
  
    return {
      orderId,
      buyer: { name: buyerName, street, city, country },
      timeline: statusTimestamps,
      articles,
      shippingPrice
    };
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getOrderInfo") {
      const info = extractOrderInfo();
      sendResponse(info);
    }
  });
  
  