package com.swu.studentlife;

import android.content.Intent;
import android.os.Bundle;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

import com.swu.studentlife.api.ApiClient;
import com.swu.studentlife.models.DashboardResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class DashboardActivity extends AppCompatActivity {
    private TextView tvStudentName, tvStudentId, tvRequirementsPercent;
    private TextView tvTotalRequests, tvCompletedRequests, tvPendingRequests;
    private ProgressBar progressBar;
    private Button navHome, navRequests, navChat;
    private String studentId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dashboard);

        tvStudentName = findViewById(R.id.tvStudentName);
        tvStudentId = findViewById(R.id.tvStudentId);
        tvRequirementsPercent = findViewById(R.id.tvRequirementsPercent);
        tvTotalRequests = findViewById(R.id.tvTotalRequests);
        tvCompletedRequests = findViewById(R.id.tvCompletedRequests);
        tvPendingRequests = findViewById(R.id.tvPendingRequests);
        progressBar = findViewById(R.id.progressBar);

        navHome = findViewById(R.id.navHome);
        navRequests = findViewById(R.id.navRequests);
        navChat = findViewById(R.id.navChat);

        studentId = getIntent().getStringExtra("STUDENT_ID");
        if (studentId == null) {
            studentId = "2023-00456";
        }

        tvStudentId.setText("ID: " + studentId + " • BS Computer Science");
        tvStudentName.setText("Maria Santos");

        setupNavigation();
        fetchDashboardData(studentId);
    }

    private void fetchDashboardData(String id) {
        ApiClient.getClient().getDashboard(id).enqueue(new Callback<DashboardResponse>() {
            @Override
            public void onResponse(Call<DashboardResponse> call, Response<DashboardResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    DashboardResponse resp = response.body();
                    if (resp.isSuccess() && resp.getData() != null) {
                        DashboardResponse.DashboardData data = resp.getData();
                        
                        int pct = data.getRequirementsPercentage();
                        tvRequirementsPercent.setText(pct + "%");
                        progressBar.setProgress(pct);

                        tvTotalRequests.setText(String.valueOf(data.getTotalRequests()));
                        tvCompletedRequests.setText(String.valueOf(data.getCompletedRequests()));
                        tvPendingRequests.setText(String.valueOf(data.getPendingRequests()));
                    }
                } else {
                    Toast.makeText(DashboardActivity.this, "Failed to load dashboard data", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<DashboardResponse> call, Throwable t) {
                Toast.makeText(DashboardActivity.this, "Network error: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void setupNavigation() {
        navHome.setOnClickListener(v -> {
            // Already on home/dashboard
        });

        navRequests.setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, RequestsActivity.class);
            intent.putExtra("STUDENT_ID", studentId);
            startActivity(intent);
        });

        navChat.setOnClickListener(v -> {
            Intent intent = new Intent(DashboardActivity.this, ChatbotActivity.class);
            intent.putExtra("STUDENT_ID", studentId);
            startActivity(intent);
        });
    }
}
