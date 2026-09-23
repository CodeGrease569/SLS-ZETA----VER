package com.swu.studentlife.api;

import com.google.gson.JsonObject;
import com.swu.studentlife.models.DashboardResponse;
import com.swu.studentlife.models.StudentRequest;
import com.swu.studentlife.models.StudentResponse;

import java.util.List;

import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.Multipart;
import retrofit2.http.POST;
import retrofit2.http.Part;
import retrofit2.http.Path;
import retrofit2.http.Query;

public interface ApiService {

    @POST("login.php")
    Call<StudentResponse> login(@Body JsonObject body);

    @POST("signup.php")
    Call<StudentResponse> register(@Body JsonObject body);

    @GET("dashboard.php")
    Call<DashboardResponse> getDashboard(@Query("studentId") String studentId);

    @GET("requests.php")
    Call<List<StudentRequest>> getRequests(@Query("studentId") String studentId);

    @POST("requests.php")
    Call<JsonObject> submitRequest(@Body JsonObject body);

    @Multipart
    @POST("upload.php")
    Call<JsonObject> uploadDocument(
            @Part("studentId") RequestBody studentId,
            @Part("documentType") RequestBody documentType,
            @Part MultipartBody.Part file
    );
}
