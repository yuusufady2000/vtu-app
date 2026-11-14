
const crypto = require("crypto");

exports.sendEmailNotification = async ({
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
        target_channel: "email",
        email_subject: title,
        email_body: message,
        idempotency_key: crypto.randomUUID()
    };

    if (data) {
        payload.custom_data = data;
    }

    const response = await fetch(
        "https://api.onesignal.com/notifications?c=email",
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
                : "OneSignal email request failed"
        );
    }

    if (!result.id) {
        return {
            sent: false,
            errors: result.errors || "No subscribed email recipient found"
        };
    }

    return {
        sent: true,
        notificationId: result.id,
        errors: result.errors || null
    };
};
