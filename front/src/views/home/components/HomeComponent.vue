<script setup>
import { Field, Form, ErrorMessage } from "vee-validate";
import { useRouter } from "vue-router";

const router = useRouter();

function validateCode(value) {
  if (!value) {
    return "Please, provide room code";
  }

  return true;
}

function onSubmit(values) {
  router.push(`/prepare/${values.roomCode}`);
}
</script>

<template>
  <div class="hero min-h-screen bg-base-200">
    <div class="hero-content text-center">
      <div class="max-w-md">
        <h1 class="text-5xl font-bold">Hello there</h1>
        <p class="py-6">Welcome to Potich Meet</p>
        <Form @submit="onSubmit">
          <div class="form-control">
            <div class="input-group">
              <div>
                <Field
                  name="roomCode"
                  type="text"
                  placeholder="Enter your code here..."
                  class="input input-bordered"
                  :rules="validateCode"
                />
                <ErrorMessage
                  class="mt-5 bg-inherit text-error"
                  name="roomCode"
                />
              </div>
              <button class="btn">Connect to meeting</button>
            </div>
          </div>
        </Form>
      </div>
    </div>
  </div>
</template>
