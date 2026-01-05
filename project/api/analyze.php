<?php
// api/analyze.php
declare(strict_types=1);

require __DIR__ . '/_bootstrap.php';
// require_login();

/**
 * 一律回 JSON，避免任何 warning/notice 混成 HTML
 */
header('Content-Type: application/json; charset=utf-8');
error_reporting(0);
ini_set('display_errors', '0');

function r(int $min, int $max): int {
  return random_int($min, $max);
}

// 1) 檢查上傳
if (!isset($_FILES['photo'])) {
  json_out(['ok' => false, 'error' => 'missing photo'], 400);
}

$up = $_FILES['photo'];
if (!is_array($up) || ($up['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
  json_out(['ok' => false, 'error' => 'upload error'], 400);
}

// 檢查 MIME（基本防呆）
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = $finfo ? finfo_file($finfo, $up['tmp_name']) : '';
if ($finfo) finfo_close($finfo);

$allowed = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($mime, $allowed, true)) {
  json_out(['ok' => false, 'error' => 'invalid file type', 'mime' => $mime], 400);
}

// 2) 準備 uploads 目錄（在專案根目錄 /uploads）
$uploadsPath = realpath(__DIR__ . '/../uploads');
if ($uploadsPath === false) {
  $target = __DIR__ . '/../uploads';
  @mkdir($target, 0777, true);
  $uploadsPath = realpath($target);
}
if ($uploadsPath === false) {
  json_out(['ok' => false, 'error' => 'cannot create uploads dir'], 500);
}

// 3) 存檔
$ext = 'jpg';
if ($mime === 'image/png') $ext = 'png';
if ($mime === 'image/webp') $ext = 'webp';

$payloadId = bin2hex(random_bytes(8));
$filename = 'cap_' . date('Ymd_His') . '_' . $payloadId . '.' . $ext;
$dest = $uploadsPath . DIRECTORY_SEPARATOR . $filename;

if (!move_uploaded_file($up['tmp_name'], $dest)) {
  json_out(['ok' => false, 'error' => 'move failed'], 500);
}

// ✅ 注意：前端在根目錄跑 (http://localhost:8080/...) 時，這個相對路徑會正確
$photoUrl = 'uploads/' . $filename;

// 4) 產生「前端吃得下」的 metrics（物件格式）
$metrics = [
  'glow'       => r(55, 95), // 光澤
  'complexion' => r(50, 95), // 氣色
  'blemish'    => r(40, 90), // 瑕疵（越高越少瑕疵）
  'oilBalance' => r(45, 90), // 油水平衡
  'evenness'   => r(50, 95), // 均勻度
];

$overall = (int) round(array_sum($metrics) / count($metrics));

$tag =
  $overall >= 85 ? '狀態極佳' :
  ($overall >= 75 ? '整體良好' :
  ($overall >= 60 ? '可再提升' : '需要加強'));

$skinType =
  ($metrics['oilBalance'] < 55 && $metrics['evenness'] < 60) ? '偏乾 / 缺水型' :
  ($metrics['oilBalance'] < 55 ? '混合偏油' : '偏穩定');

$summary =
  $overall >= 75
    ? '氣色與膚況整體穩定，維持作息與補水，亮度會更明顯。'
    : ($overall >= 60
        ? '整體不錯但仍有可加強點，先把保濕與防曬做穩，改善會很快。'
        : '目前狀態偏疲態或膚況不穩，建議先從睡眠、清潔、保濕打底。');

// 5) Tips（回傳「字串陣列」最穩）
$tips = [];
if ($metrics['complexion'] < 60) $tips[] = '氣色偏低：建議自然光下重拍，並確認睡眠與飲水。';
if ($metrics['blemish'] < 55)    $tips[] = '瑕疵指標偏低：先把溫和清潔＋保濕做穩，避免刺激性保養。';
if ($metrics['oilBalance'] < 55) $tips[] = '油水平衡偏低：可能過乾或過油，建議簡化保養並觀察 3–7 天。';
if ($metrics['glow'] < 60)       $tips[] = '光澤偏低：避免背光與強反光，採自然側光更準確。';
if ($metrics['evenness'] < 60)   $tips[] = '均勻度偏低：防曬與減少摩擦，通常是提升關鍵。';

if (count($tips) === 0) {
  $tips = [
    '目前沒有明顯弱項：維持作息＋防曬習慣即可。',
    '同時間連續拍 3 天，比單次結果更可信。',
  ];
}

// 5.5) 商品推薦（可由後端替換成真實資料）
$products = [
  [
    'name' => '溫和潔面',
    'desc' => '低刺激、日常清潔用，避免過度清潔造成乾燥。',
    'tag'  => '基礎清潔',
    'url'  => '#',
  ],
  [
    'name' => '保濕精華',
    'desc' => '補水打底，改善乾燥與粗糙感。',
    'tag'  => '補水修護',
    'url'  => '#',
  ],
  [
    'name' => '清爽乳液',
    'desc' => '油水平衡與鎖水兼顧，適合混合/油性肌。',
    'tag'  => '清爽保濕',
    'url'  => '#',
  ],
];

// 6) 回傳
json_out([
  'ok'          => true,
  'payload_id'  => $payloadId,
  'generated_at'=> date('c'),
  'photo_url'   => $photoUrl,
  'overall'     => $overall,
  'tag'         => $tag,
  'skinType'    => $skinType,
  'summary'     => $summary,
  'metrics'     => $metrics,
  'tips'        => $tips,
  'products'    => $products,
]);
