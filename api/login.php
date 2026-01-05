<?php
require __DIR__ . '/_bootstrap.php';

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if ($username === 'ray' && $password === '1234') {
  $_SESSION['user'] = ['username' => $username];
  json_out(['ok'=>true, 'username'=>$username]);
}

http_response_code(401);
echo "帳號或密碼錯誤";
