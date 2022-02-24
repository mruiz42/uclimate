public interface APODClient {
    @GET("/planetary/apod")
    @Headers("accept: application/json")
    CompletableFuture<APOD> getApod(@Query("api_key") String apiKey);
}