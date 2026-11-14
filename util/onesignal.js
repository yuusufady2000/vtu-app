
const crypto = require("crypto");

exports.sendPushNotification = async ({
    externalId,
    title,
    message,
    data
}) => {
    if (!process.env.ONESIGNAL_APP_ID) {
        throw new Error("ONESIGNAL_APP_ID is missing");
    }

    if (!process.env.ONESIGNAL_REST_API_KEY) {
        throw new Error("ONESIGNAL_REST_API_KEY is missing");
    }

    if (!externalId || !title || !message) {
        throw new Error("External ID, title and message are required");
    }

    const payload = {
        app_id: process.env.ONESIGNAL_APP_ID,
        include_aliases: {
            external_id: [String(externalId)]
        },
        target_channel: "push",
        headings: {
            en: title
        },
        contents: {
            en: message
        },
        idempotency_key: crypto.randomUUID()
    };

    if (data) {
        payload.data = data;
    }

    const response = await fetch(
        "https://api.onesignal.com/notifications?c=push",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Key ${process.env.ONESIGNAL_REST_API_KEY}`
            },
            body: JSON.stringify(payload)
        }
    );

    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            result.errors
                ? JSON.stringify(result.errors)
                : "OneSignal notification request failed"
        );
    }

    if (!result.id) {
        return {
            sent: false,
            errors: result.errors || "No subscribed recipient found"
        };
    }

    return {
        sent: true,
        notificationId: result.id,
        errors: result.errors || null
    };
};
