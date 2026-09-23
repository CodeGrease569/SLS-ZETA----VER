<?php
/**
 * login.php — REST API endpoint for student login authentication against PostgreSQL
 */
header("Content-Type: application/json; charset=UTF-8");
require_once 'db.php';

$input = json_decode(file_get_contents('php://input'), true);
$identifier = $input['identifier'] ?? '';
$password = $input['password'] ?? '';

if (empty($identifier) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Identifier and password are required"]);
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM students WHERE student_id = ? OR email = ?");
    $stmt->execute([$identifier, $identifier]);
    $student = $stmt->fetch();

    if ($student && password_verify($password, $student['password_hash'])) {
        echo json_encode([
            "success" => true,
            "message" => "Authentication successful",
            "user" => [
                "id" => $student['id'],
                "studentId" => $student['student_id'],
                "firstName" => $student['first_name'],
                "lastName" => $student['last_name'],
                "email" => $student['email'],
                "course" => $student['course'],
                "yearLevel" => $student['year_level']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Invalid student ID/email or password"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
?>
