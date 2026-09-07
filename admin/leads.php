<?php
declare(strict_types=1);

$user = getenv('BARTSS_ADMIN_USER') ?: '';
$pass = getenv('BARTSS_ADMIN_PASSWORD') ?: '';

if ($user === '' || $pass === '') {
    http_response_code(503);
    echo 'Admin access is not configured. Set BARTSS_ADMIN_USER and BARTSS_ADMIN_PASSWORD on the server.';
    exit;
}

$givenUser = $_SERVER['PHP_AUTH_USER'] ?? '';
$givenPass = $_SERVER['PHP_AUTH_PW'] ?? '';

if (!hash_equals($user, $givenUser) || !hash_equals($pass, $givenPass)) {
    header('WWW-Authenticate: Basic realm="BARTSS Leads"');
    http_response_code(401);
    echo 'Authentication required.';
    exit;
}

$leadFile = dirname(__DIR__) . '/storage/leads.jsonl';
$leads = [];

if (is_file($leadFile)) {
    $fh = fopen($leadFile, 'rb');
    if ($fh) {
        while (($line = fgets($fh)) !== false) {
            $row = json_decode($line, true);
            if (!is_array($row) || empty($row['lead_id'])) continue;
            $id = $row['lead_id'];
            if (!isset($leads[$id])) $leads[$id] = ['lead_id' => $id];
            $leads[$id] = array_merge($leads[$id], $row);
            unset($leads[$id]['token_hash'], $leads[$id]['ip_hash'], $leads[$id]['user_agent']);
        }
        fclose($fh);
    }
}

usort($leads, fn($a, $b) => strcmp($b['created_at'] ?? $b['updated_at'] ?? '', $a['created_at'] ?? $a['updated_at'] ?? ''));

function e($v): string { return htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8'); }
?><!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BARTSS Leads</title>
<style>
*{box-sizing:border-box}body{margin:0;font-family:Inter,Arial,sans-serif;background:#eef1ef;color:#11171b}.wrap{width:min(1400px,calc(100vw - 36px));margin:36px auto}.top{display:flex;justify-content:space-between;align-items:end;margin-bottom:28px}.top h1{font-size:54px;letter-spacing:-.055em;font-weight:400;margin:0}.top span{font-size:11px;opacity:.5}.grid{display:grid;gap:12px}.lead{background:white;border:1px solid rgba(0,0,0,.08);border-radius:22px;padding:22px;display:grid;grid-template-columns:170px 1fr 1fr;gap:22px}.meta small,.cell small{display:block;font-size:8px;letter-spacing:.16em;opacity:.45;margin-bottom:7px}.meta b{font-size:14px}.status{display:inline-block;margin-top:14px;padding:7px 9px;border-radius:999px;background:#dce879;font-size:9px}.cell b{display:block;font-size:18px;font-weight:500;margin-bottom:5px}.cell p{font-size:12px;line-height:1.5;opacity:.68;margin:0 0 15px}.problem{grid-column:2/-1;padding-top:14px;border-top:1px solid rgba(0,0,0,.08)}.empty{padding:50px;border:1px dashed rgba(0,0,0,.15);border-radius:20px;text-align:center;opacity:.5}@media(max-width:800px){.lead{grid-template-columns:1fr}.problem{grid-column:auto}.top h1{font-size:38px}}
</style></head><body><main class="wrap"><div class="top"><div><span>BARTSS / SALES INBOX</span><h1>Qualified leads</h1></div><span><?= count($leads) ?> total</span></div>
<div class="grid">
<?php if (!$leads): ?><div class="empty">No leads yet.</div><?php endif; ?>
<?php foreach ($leads as $lead): ?>
<article class="lead">
  <div class="meta"><small>LEAD ID</small><b><?= e($lead['lead_id']) ?></b><div class="status"><?= e($lead['status'] ?? 'new') ?></div><p><?= e($lead['created_at'] ?? '') ?></p></div>
  <div class="cell"><small>CONTACT</small><b><?= e($lead['name'] ?? '') ?></b><p><?= e($lead['email'] ?? '') ?><br><?= e($lead['phone'] ?? '') ?></p><small>COMPANY / ROLE</small><p><?= e($lead['company'] ?? '') ?><br><?= e($lead['role'] ?? '') ?></p></div>
  <div class="cell"><small>ENGAGEMENT</small><b><?= e($lead['selected_scope'] ?? $lead['engagement'] ?? '') ?></b><p><?= e($lead['budget'] ?? '') ?></p><small>COMPANY SITE</small><p><?= e($lead['company_site'] ?? '') ?></p></div>
  <div class="cell problem"><small>WHAT NEEDS TO CHANGE</small><p><?= nl2br(e($lead['problem'] ?? '')) ?></p></div>
</article>
<?php endforeach; ?>
</div></main></body></html>