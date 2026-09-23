package com.swu.studentlife.models;

import com.google.gson.annotations.SerializedName;

public class StudentResponse {
    @SerializedName("success")
    private boolean success;

    @SerializedName("message")
    private String message;

    @SerializedName("user")
    private Student user;

    public boolean isSuccess() { return success; }
    public String getMessage() { return message; }
    public Student getUser() { return user; }

    public static class Student {
        @SerializedName("id")
        private int id;

        @SerializedName("studentId")
        private String studentId;

        @SerializedName("firstName")
        private String firstName;

        @SerializedName("lastName")
        private String lastName;

        @SerializedName("email")
        private String email;

        @SerializedName("course")
        private String course;

        @SerializedName("yearLevel")
        private String yearLevel;

        public int getId() { return id; }
        public String getStudentId() { return studentId; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
        public String getEmail() { return email; }
        public String getCourse() { return course; }
        public String getYearLevel() { return yearLevel; }
    }
}
