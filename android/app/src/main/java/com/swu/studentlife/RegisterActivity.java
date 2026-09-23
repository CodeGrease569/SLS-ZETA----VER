package com.swu.studentlife;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.google.gson.JsonObject;
import com.swu.studentlife.api.ApiClient;
import com.swu.studentlife.api.ApiService;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {
    private EditText etFirstName, etLastName, etStudentId, etEmail, etRegPassword;
    private Button btnSubmitRegister;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        etFirstName = findViewById(R.id.etFirstName);
        etLastName = findViewById(R.id.etLastName);
        etStudentId = findViewById(R.id.etStudentId);
        etEmail = findViewById(R.id.etEmail);
        etRegPassword = findViewById(R.id.etRegPassword);
        btnSubmitRegister = findViewById(R.id.btnSubmitRegister);

        btnSubmitRegister.setOnClickListener(v -> performRegistration());
    }

    private void performRegistration() {
        String firstName = etFirstName.getText().toString().trim();
        String lastName = etLastName.getText().toString().trim();
        String studentId = etStudentId.getText().toString().trim();
        String email = etEmail.getText().toString().trim();
        String password = etRegPassword.getText().toString().trim();

        if (firstName.isEmpty() || lastName.isEmpty() || studentId.isEmpty() || email.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Please fill in all required fields", Toast.LENGTH_SHORT).show();
            return;
        }

        JsonObject body = new JsonObject();
        body.addProperty("firstName", firstName);
        body.addProperty("lastName", lastName);
        body.addProperty("studentId", studentId);
        body.addProperty("email", email);
        body.addProperty("password", password);

        ApiService api = ApiClient.getClient();
        api.signup(body).enqueue(new Callback<JsonObject>() {
            @Override
            public void onResponse(Call<JsonObject> call, Response<JsonObject> response) {
                if (response.isSuccessful() && response.body() != null) {
                    JsonObject json = response.body();
                    if (json.get("success").getAsBoolean()) {
                        Toast.makeText(RegisterActivity.this, "Account Created Successfully!", Toast.LENGTH_SHORT).show();
                        Intent intent = new Intent(RegisterActivity.this, DashboardActivity.class);
                        intent.putExtra("STUDENT_ID", studentId);
                        startActivity(intent);
                        finish();
                    } else {
                        Toast.makeText(RegisterActivity.this, "Registration failed", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(RegisterActivity.this, "Server error during registration", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<JsonObject> call, Throwable t) {
                Toast.makeText(RegisterActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }
}
