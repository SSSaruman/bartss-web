<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method_not_allowed']);
    exit;
}

$storageDir = getenv('BARTSS_STORAGE_DIR') ?: (dirname(__DIR__) . '/storage');
$leadFile = $storageDir . '/leads.jsonl';
$rateFile = $storageDir . '/rate.json';

if (!is_dir($storageDir) && !mkdir($storageDir, 0750, true) && !is_dir($storageDir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'storage_unavailable']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid_json']);
    exit;
}

function clean($value, int $max = 500): string {
    $v = trim((string)($value ?? ''));
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return function_exists('mb_substr') ? mb_substr($v, 0, $max) : substr($v, 0, $max);
}

function clientIp(): string {
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function rateLimit(string $rateFile): bool {
    $ipHash = hash('sha256', clientIp());
    $now = time();
    $window = 600;
    $max = 8;
    $rows = [];

    if (is_file($rateFile)) {
        $decoded = json_decode((string)file_get_contents($rateFile), true);
        if (is_array($decoded)) $rows = $decoded;
    }

    foreach ($rows as $key => $events) {
        if (!is_array($events)) { unset($rows[$key]); continue; }
        $rows[$key] = array_values(array_filter($events, fn($ts) => is_int($ts) && $ts > $now - $window));
        if (!$rows[$key]) unset($rows[$key]);
    }

    $events = $rows[$ipHash] ?? [];
    if (count($events) >= $max) return false;

    $events[] = $now;
    $rows[$ipHash] = $events;
    file_put_contents($rateFile, json_encode($rows), LOCK_EX);
    return true;
}

function appendEvent(string $leadFile, array $event): bool {
    $line = json_encode($event, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . PHP_EOL;
    return file_put_contents($leadFile, $line, FILE_APPEND | LOCK_EX) !== false;
}

function leadExists(string $leadFile, string $leadId, string $token): bool {
    if (!is_file($leadFile)) return false;
    $tokenHash = hash('sha256', $token);
    $fh = fopen($leadFile, 'rb');
    if (!$fh) return false;
    $valid = false;
    while (($line = fgets($fh)) !== false) {
        $row = json_decode($line, true);
        if (!is_array($row)) continue;
        if (($row['lead_id'] ?? '') === $leadId && ($row['action'] ?? '') === 'create') {
            $valid = hash_equals((string)($row['token_hash'] ?? ''), $tokenHash);
            break;
        }
    }
    fclose($fh);
    return $valid;
}

function notifyBartss(array $lead, string $stage): void {
    $to = getenv('BARTSS_LEAD_EMAIL') ?: 'hello@bartss.com';
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) return;

    $subject = '[BARTSS Lead] ' . ($lead['lead_id'] ?? 'New') . ' · ' . ($lead['company'] ?? '');
    $body = "Stage: {$stage}\n";
    foreach (['lead_id','name','email','phone','company','role','engagement','budget','selected_scope','problem'] as $key) {
        if (isset($lead[$key]) && $lead[$key] !== '') $body .= strtoupper($key) . ': ' . $lead[$key] . "\n";
    }
    $headers = "Content-Type: text/plain; charset=UTF-8\r\n";
    $headers .= "From: BARTSS Website <no-reply@bartss.com>\r\n";
    if (!empty($lead['email']) && filter_var($lead['email'], FILTER_VALIDATE_EMAIL)) {
        $headers .= "Reply-To: " . $lead['email'] . "\r\n";
    }
    @mail($to, $subject, $body, $headers);
}

if (!rateLimit($rateFile)) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'rate_limited']);
    exit;
}

$action = clean($data['action'] ?? 'create', 40);
$honeypot = clean($data['company_fax'] ?? '', 120);
if ($honeypot !== '') {
    echo json_encode(['ok' => true, 'leadId' => 'accepted']);
    exit;
}

if ($action === 'create') {
    $lead = [
        'action' => 'create',
        'lead_id' => 'BRT-' . gmdate('Ymd') . '-' . strtoupper(bin2hex(random_bytes(3))),
        'created_at' => gmdate('c'),
        'status' => 'new',
        'source' => 'website',
        'name' => clean($data['name'] ?? '', 120),
        'email' => strtolower(clean($data['email'] ?? '', 180)),
        'phone' => clean($data['phone'] ?? '', 80),
        'company' => clean($data['company'] ?? '', 180),
        'role' => clean($data['role'] ?? '', 180),
        'company_site' => clean($data['company_site'] ?? '', 240),
        'engagement' => clean($data['engagement'] ?? '', 120),
        'budget' => clean($data['budget'] ?? '', 120),
        'problem' => clean($data['problem'] ?? '', 3000),
        'consent' => !empty($data['consent']),
        'ip_hash' => hash('sha256', clientIp()),
        'user_agent' => clean($_SERVER['HTTP_USER_AGENT'] ?? '', 300),
    ];

    if (!filter_var($lead['email'], FILTER_VALIDATE_EMAIL) ||
        (function_exists('mb_strlen') ? mb_strlen($lead['problem']) : strlen($lead['problem'])) < 20 || !$lead['consent']) {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'validation_failed']);
        exit;
    }

    $token = bin2hex(random_bytes(24));
    $lead['token_hash'] = hash('sha256', $token);

    if (!appendEvent($leadFile, $lead)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'write_failed']);
        exit;
    }

    notifyBartss($lead, 'NEW LEAD');

    echo json_encode([
        'ok' => true,
        'leadId' => $lead['lead_id'],
        'updateToken' => $token
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$leadId = clean($data['lead_id'] ?? '', 40);
$token = clean($data['update_token'] ?? '', 120);

if ($leadId === '' || $token === '' || !leadExists($leadFile, $leadId, $token)) {
    http_response_code(403);
    echo json_encode(['ok' => false, 'error' => 'invalid_lead_token']);
    exit;
}

if ($action === 'update_scope' || $action === 'qualify') {
    $event = [
        'action' => $action,
        'lead_id' => $leadId,
        'updated_at' => gmdate('c'),
        'selected_scope' => clean($data['selected_scope'] ?? '', 120),
        'status' => $action === 'qualify' ? 'qualified' : 'scope_selected',
    ];

    if ($event['selected_scope'] === '') {
        http_response_code(422);
        echo json_encode(['ok' => false, 'error' => 'scope_required']);
        exit;
    }

    if (!appendEvent($leadFile, $event)) {
        http_response_code(500);
        echo json_encode(['ok' => false, 'error' => 'write_failed']);
        exit;
    }

    if ($action === 'qualify') {
        notifyBartss(array_merge($event, [
            'company' => clean($data['company'] ?? '', 180),
            'email' => strtolower(clean($data['email'] ?? '', 180)),
        ]), 'QUALIFIED');
    }

    echo json_encode(['ok' => true, 'leadId' => $leadId, 'status' => $event['status']]);
    exit;
}

http_response_code(400);
echo json_encode(['ok' => false, 'error' => 'unknown_action']);
