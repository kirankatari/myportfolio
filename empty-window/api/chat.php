<?php
/**
 * Portfolio AI assistant — same-origin POST /api/chat (Nginx routes here, not exposed as .php URL).
 * OpenAI key only in config.local.php on the server.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-4o-mini';

const COFFEE_BREAK_MESSAGE =
    "I'm taking a short break. Please try again in a minute, or email kirankatari99@gmail.com.";

$configPath = __DIR__ . '/config.local.php';
$apiKey = '';
if (is_readable($configPath)) {
    $cfg = require $configPath;
    if (is_array($cfg) && !empty($cfg['openai_api_key'])) {
        $apiKey = trim((string) $cfg['openai_api_key']);
    }
}

function sendJson(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function sendCoffeeBreak(): void
{
    sendJson([
        'ok' => false,
        'reply' => COFFEE_BREAK_MESSAGE,
        'answer' => COFFEE_BREAK_MESSAGE,
        'error' => COFFEE_BREAK_MESSAGE,
    ], 200);
}

function normalizeContent(string $content, int $limit = 1200): string
{
    $content = trim((string) preg_replace('/\s+/', ' ', $content));
    if (strlen($content) > $limit) {
        $content = substr($content, 0, $limit);
    }
    return $content;
}

/**
 * @return list<array{role: string, content: string}>
 */
function getUserMessages(array $payload): array
{
    $messages = [];

    if (isset($payload['message']) && is_string($payload['message'])) {
        $messages[] = [
            'role' => 'user',
            'content' => normalizeContent($payload['message']),
        ];
    }

    if (isset($payload['messages']) && is_array($payload['messages'])) {
        foreach ($payload['messages'] as $message) {
            if (!is_array($message)) {
                continue;
            }
            $role = (string) ($message['role'] ?? '');
            $content = normalizeContent((string) ($message['content'] ?? ''));
            if (!in_array($role, ['user', 'assistant'], true) || $content === '') {
                continue;
            }
            $messages[] = ['role' => $role, 'content' => $content];
        }
    }

    $messages = array_slice($messages, -16);
    foreach ($messages as $message) {
        if ($message['role'] === 'user') {
            return $messages;
        }
    }
    return [];
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson([
        'ok' => false,
        'error' => 'Use POST from the portfolio chat assistant.',
    ], 405);
}

$rawInput = file_get_contents('php://input') ?: '';
$payload = json_decode($rawInput, true);

if (!is_array($payload)) {
    sendJson([
        'ok' => false,
        'error' => 'Send JSON with a "message" field or OpenAI-style "messages".',
    ], 400);
}

$conversation = getUserMessages($payload);

if ($conversation === []) {
    sendJson([
        'ok' => false,
        'error' => 'Please enter a question about skills, projects, education, or certifications.',
    ], 422);
}

if ($apiKey === '' || str_starts_with($apiKey, 'sk-proj-PASTE')) {
    error_log('Portfolio assistant: add api/config.local.php with openai_api_key.');
    sendCoffeeBreak();
}

$systemPrompt = <<<'PROMPT'
You are the portfolio assistant for Venkata Naga Kiran Katari. Answer only from the facts below plus reasonable cybersecurity vocabulary. If something is not covered, say it is not on the public portfolio and suggest kirankatari99@gmail.com or LinkedIn.

When asked about skills or tools, use the technical skills list and connect them to projects where relevant.

FACTS:
- Focus: Cybersecurity graduate student; ethical hacking; network security; Philadelphia, PA.
- Education: M.S. Computer Science in progress at Rowan University; hands-on projects and certifications.
- Technical skills: Python, Java, C, SQL, Linux, network security, ethical hacking, SIEM/SOC, Burp Suite, Nmap, Wireshark, Splunk, Microsoft Sentinel, OWASP, incident response.
- Projects:
  1) IoT intrusion detection with CNN, LSTM, DNN; KDDCup99, NSL-KDD, UNSW-NB15; Flask demo; published ICCIET 2024 (Atlantis Press).
  2) Behavior-based ransomware detection via file system monitoring; Python; VirtualBox lab; rule and anomaly detection.
  3) Educational keylogger PoC with GUI (awareness / ethical context only).
  4) Student Database Management System: PHP, HTML, CSS, MySQL; CRUD, views, procedures, triggers.
- Certifications: Microsoft Azure Fundamentals AZ-900; Coursera Intro to Cyber Security; CompTIA Security+ (in progress).
- Contact: kirankatari99@gmail.com

Tone: professional, concise; first person ("I") is OK when summarizing Kiran's background. Never invent employers, dates, or credentials. No harmful instructions.
PROMPT;

$requestBody = [
    'model' => OPENAI_MODEL,
    'messages' => array_merge(
        [['role' => 'system', 'content' => $systemPrompt]],
        $conversation
    ),
    'temperature' => 0.4,
    'max_tokens' => 700,
];

$ch = curl_init(OPENAI_ENDPOINT);
if ($ch === false) {
    error_log('Portfolio assistant: curl_init failed.');
    sendCoffeeBreak();
}

curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => json_encode($requestBody, JSON_UNESCAPED_SLASHES),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_TIMEOUT => 25,
]);

$responseBody = curl_exec($ch);
$curlError = curl_error($ch);
$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($responseBody === false || $curlError !== '') {
    error_log('Portfolio assistant: OpenAI request failed: ' . $curlError);
    sendCoffeeBreak();
}

if ($httpCode < 200 || $httpCode >= 300) {
    error_log('Portfolio assistant: OpenAI HTTP ' . $httpCode);
    sendCoffeeBreak();
}

$response = json_decode((string) $responseBody, true);
if (!is_array($response)) {
    error_log('Portfolio assistant: invalid JSON from OpenAI.');
    sendCoffeeBreak();
}

$answer = trim((string) ($response['choices'][0]['message']['content'] ?? ''));
if ($answer === '') {
    error_log('Portfolio assistant: empty answer from OpenAI.');
    sendCoffeeBreak();
}

sendJson([
    'ok' => true,
    'reply' => $answer,
    'answer' => $answer,
], 200);
