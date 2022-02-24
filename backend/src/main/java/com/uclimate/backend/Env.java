package com.uclimate.backend;
import io.github.cdimascio.dotenv.Dotenv;

public class Env {
    public Env() {

    }

    private static final Dotenv dotenv = Dotenv.configure()
            .directory("./backend")
            .filename("./default.env")
            .load();

    public static String get(String key) {
        return dotenv.get(key);
    }
}
