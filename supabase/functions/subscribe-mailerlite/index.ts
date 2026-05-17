import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const MAILERLITE_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiNWQwNDZmNDU5ZjM5ZmE3NWMyMTZkMmY5YjRhODJjYTIxODNiNzIwMWQyYmE2ZjBhMmQzODQ0YWYwYjIxNDJkZjkyYjEwODc2M2ZlNTU0MjgiLCJpYXQiOjE3NzkwNDM4NjcuOTkxNzg3LCJuYmYiOjE3NzkwNDM4NjcuOTkxNzg5LCJleHAiOjQ5MzQ3MTc0NjcuOTg3NDk4LCJzdWIiOiIyMzc0NjIzIiwic2NvcGVzIjpbXX0.s87Keaj1Yd_SRuMsDqdlYOSG9gxYy3-pbUWT9aiwUp97BwSuldLBiq6BqCaM-ePYVLXOxz9lFbxPoyox_0TIcH8fY4VlTXENO7hmTocxAX0-6sDP3OwxtUzyI2UJCvUizcGZvnW9Mt4cpX01lwopJtxRivLA4xI-Kuqq9kAq65ceGmfySwkE5lAxxb1EQ4tRkUlyP7fdPfG5x0HjDP1GKGI6HjU6i6m7kosibv8X28UlOpjnPJdfEMjBgILkKG68lJPDdSWjc3I9UhvC3ENwbs7DW-Ha9Fo_6RVIeWPm-NPeYxzcLBExdM89r5nWJmGZSQ1nnlJledu-2scmbXkYqOxuTg1zPz37hTUblKaZTQ2-pp6BWh_ZsiipjvEKdLgBIhR2xP9RjIWnMYK3wL06Nn-nGQO42HrzcIu0nI6ouRhDtU5S2o8tbfgDLKinqQaHlhqbAuyfVH7FT1fC2iIJBfGZ09_QF6_8gO1Gxq4nJHc4B5aVgUifaITu6GRYYWmoyV7TdvuEkmJXxeh2BT7IKfeKdbURkGkrLW9nraBaX_oesIMsQYIfGKhmvP2I3n4oiVyWff0HdQ155iID3qTK55ipIwg53Y2vephyOEHYxsThxRsbbWLqkahmEtB0XKYuQvf8sd-6pAX5F6bgSTOUiKaXuTQVR6W9Dz0mJug5NOU";
const MAILERLITE_GROUP_ID = "187737941451212044";

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { name, email } = await req.json();

    if (!email || !name) {
      return new Response(JSON.stringify({ error: "name and email required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Add subscriber to MailerLite group
    const mlRes = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MAILERLITE_API_KEY}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        email: email,
        fields: { name: name },
        groups: [MAILERLITE_GROUP_ID],
        status: "active",
      }),
    });

    const mlData = await mlRes.json();

    // 200 = new subscriber, 201 = updated existing subscriber — both are success
    if (mlRes.ok || mlRes.status === 200 || mlRes.status === 201) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    } else {
      console.error("MailerLite error:", mlData);
      return new Response(JSON.stringify({ error: "MailerLite error", details: mlData }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
