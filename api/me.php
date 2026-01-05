<?php
require __DIR__ . '/_bootstrap.php';
if (!isset($_SESSION['user'])) {
  http_response_code(401);
  exit;
}
json_out($_SESSION['user']);
