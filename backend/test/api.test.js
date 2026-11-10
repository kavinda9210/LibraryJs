const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const http = require("http");
const app = require("../server");

let server;
let baseUrl;
let adminToken = "";
let userToken = "";

before(() => {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

after(() => {
  return new Promise((resolve) => {
    if (server) server.close(resolve);
    else resolve();
  });
});

describe("Library LMS Backend API Integration Tests", () => {

  test("GET /api/health should return status ok", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
  });

  test("POST /admin/login with invalid credentials should fail (401)", async () => {
    const res = await fetch(`${baseUrl}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "lsbcp", password: "wrongpassword" }),
    });
    assert.strictEqual(res.status, 401);
  });

  test("POST /admin/login with valid credentials returns JWT token", async () => {
    const res = await fetch(`${baseUrl}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "lsbcp", password: "admin123" }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.token, "Token should be present");
    assert.strictEqual(data.admin.role, "admin");
    adminToken = data.token;
  });

  test("POST /api/auth/login with valid user credentials returns JWT token", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "max", password: "12345678" }),
    });
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(data.token, "Token should be present");
    assert.strictEqual(data.user.role, "user");
    userToken = data.token;
  });

  test("GET /users without token should be rejected (401)", async () => {
    const res = await fetch(`${baseUrl}/users`);
    assert.strictEqual(res.status, 401);
  });

  test("GET /users with regular user token should be forbidden (403)", async () => {
    const res = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.status, 403);
  });

  test("GET /users with admin token should succeed (200)", async () => {
    const res = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(res.status, 200);
    const users = await res.json();
    assert.ok(Array.isArray(users));
    assert.ok(users.length >= 1);
  });

  test("GET /itam with authenticated user should return items list (200)", async () => {
    const res = await fetch(`${baseUrl}/itam`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(res.status, 200);
    const items = await res.json();
    assert.ok(Array.isArray(items));
  });

  test("POST /outgoing with excessive stock request should rollback atomically (400)", async () => {
    const res = await fetch(`${baseUrl}/outgoing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        date: "2026-11-02",
        buy_company: "Test Customer",
        bill_number: "TEST-99999",
        items: [
          {
            itam_name: "pens(blue)",
            qty: 999999, // Exceeds available stock
            buy_price: 10,
          },
        ],
      }),
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.message.includes("Insufficient stock") || data.message.includes("Not enough"));
  });

  test("POST /itam and POST /outgoing auto-calculates both selling and cost prices", async () => {
    const uniqueItemName = `AutoCalcItem-${Date.now()}`;
    const uniqueBillNo = `BILL-AUTO-${Date.now()}`;

    // 1. Create item with unit sell price 25.00 and unit buy/cost price 15.00
    const createItemRes = await fetch(`${baseUrl}/itam`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        itam_no: `NO-${Date.now()}`,
        itam_name: uniqueItemName,
        price_per_one: 25.0,
        buy_price: 15.0,
        quantity: 50,
      }),
    });
    assert.strictEqual(createItemRes.status, 201);

    // 2. Bill checkout WITHOUT cashier supplying buy_price or sell_price
    const billRes = await fetch(`${baseUrl}/outgoing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        date: "2026-11-04",
        buy_company: "Auto Test Customer",
        bill_number: uniqueBillNo,
        items: [
          {
            itam_name: uniqueItemName,
            qty: 2,
            // Notice: buy_price is intentionally omitted to verify automatic calculation!
          },
        ],
      }),
    });
    assert.strictEqual(billRes.status, 201);
    const billData = await billRes.json();
    assert.strictEqual(billData.bill_number, uniqueBillNo);

    // 3. Verify outgoing record calculations in database
    const verifyRes = await fetch(`${baseUrl}/outgoing`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert.strictEqual(verifyRes.status, 200);
    const records = await verifyRes.json();
    assert.ok(records.length >= 1);
    const rec = records.find((r) => r.bill_number === uniqueBillNo && r.itam_name === uniqueItemName);
    assert.ok(rec, "Record should exist");
    assert.strictEqual(rec.qty, 2);
    assert.strictEqual(rec.buy_price, 15.0); // Unit cost automatically populated
    assert.strictEqual(rec.sell_price, 50.0); // 25.0 * 2 auto-calculated
    assert.strictEqual(rec.profit, 20.0); // (25.0 - 15.0) * 2 auto-calculated
  });

  test("Backup API: GET /api/backup, POST /api/backup/create, and DELETE /api/backup/:filename", async () => {
    // 1. Get status & list
    const listRes = await fetch(`${baseUrl}/api/backup`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(Array.isArray(listData.backups));
    assert.ok(listData.status);
    assert.ok(listData.status.activeDatabase);

    // 2. Create manual backup
    const createRes = await fetch(`${baseUrl}/api/backup/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ note: "Integration test manual backup" }),
    });
    assert.strictEqual(createRes.status, 201);
    const createData = await createRes.json();
    assert.ok(createData.backup);
    assert.ok(createData.backup.filename);
    const createdFilename = createData.backup.filename;

    // 3. Update backup config
    const configRes = await fetch(`${baseUrl}/api/backup/config`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        auto_backup_enabled: true,
        interval_hours: 12,
        max_retention_copies: 25,
      }),
    });
    assert.strictEqual(configRes.status, 200);
    const configData = await configRes.json();
    assert.strictEqual(configData.config.interval_hours, 12);
    assert.strictEqual(configData.config.max_retention_copies, 25);

    // 4. Delete the test backup
    const deleteRes = await fetch(`${baseUrl}/api/backup/${encodeURIComponent(createdFilename)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert.strictEqual(deleteRes.status, 200);
  });
});
