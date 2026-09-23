package com.swu.studentlife.models;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class DashboardResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("data")
    private DashboardData data;

    public boolean isSuccess() { return success; }
    public DashboardData getData() { return data; }

    public static class DashboardData {
        @SerializedName("totalRequests")
        private int totalRequests;

        @SerializedName("completedRequests")
        private int completedRequests;

        @SerializedName("pendingRequests")
        private int pendingRequests;

        @SerializedName("requirementsPercentage")
        private int requirementsPercentage;

        @SerializedName("requests")
        private List<StudentRequest> requests;

        public int getTotalRequests() { return totalRequests; }
        public int getCompletedRequests() { return completedRequests; }
        public int getPendingRequests() { return pendingRequests; }
        public int getRequirementsPercentage() { return requirementsPercentage; }
        public List<StudentRequest> getRequests() { return requests; }
    }
}
