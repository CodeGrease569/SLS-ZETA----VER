package com.swu.studentlife.models;

import com.google.gson.annotations.SerializedName;

public class StudentRequest {
    @SerializedName("id")
    private int id;

    @SerializedName("studentId")
    private String studentId;

    @SerializedName("title")
    private String title;

    @SerializedName("category")
    private String category;

    @SerializedName("office")
    private String office;

    @SerializedName("refNo")
    private String refNo;

    @SerializedName("status")
    private String status;

    @SerializedName("date")
    private String date;

    @SerializedName("remarks")
    private String remarks;

    public int getId() { return id; }
    public String getStudentId() { return studentId; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getOffice() { return office; }
    public String getRefNo() { return refNo; }
    public String getStatus() { return status; }
    public String getDate() { return date; }
    public String getRemarks() { return remarks; }
}
