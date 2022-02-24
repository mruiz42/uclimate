package com.uclimate.backend;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.maps.GeoApiContext;
import com.google.maps.GeocodingApi;
import com.google.maps.errors.ApiException;
import com.google.maps.model.GeocodingResult;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import retrofit2.Retrofit;

import java.io.IOException;


@RestController
public class Controller {
    @RequestMapping("/")
    String home() throws IOException, InterruptedException, ApiException {
        String token = Env.get("GOOGLE_MAPS_API_KEY");
        GeoApiContext context = new GeoApiContext.Builder()
                .apiKey(token)
                .build();
        GeocodingResult[] results =  GeocodingApi.geocode(context,
                "1600 Amphitheatre Parkway Mountain View, CA 94043").await();
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        System.out.println(gson.toJson(results[0].addressComponents));
        // Invoke .shutdown() after your application is done makinug requests
        context.shutdown();
        return gson.toJson(results[0].addressComponents);
    }

    @RequestMapping("/weather")
    String weather() {
        String token = Env.get("NOAA_API_TOKEN");


        return "";
    }

}
