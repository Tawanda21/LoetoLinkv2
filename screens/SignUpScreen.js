import React, { useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const SignUpHeader = () => (
  <View style={headerStyles.container}>
    <Text style={headerStyles.title}>Sign Up</Text>
    <Text style={headerStyles.subtitle}>Enter your details and start exploring</Text>
  </View>
);


const InputField = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  style,
}) => (
  <View style={[inputFieldStyles.container, style]}>
    <TextInput
      style={inputFieldStyles.input}
      placeholder={placeholder}
      placeholderTextColor="#868181"
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  </View>
);

const SocialButton = ({ provider, onPress, style, textStyle }) => (
  <TouchableOpacity style={[socialButtonStyles.button, style]} onPress={onPress}>
    <Text style={[socialButtonStyles.buttonText, textStyle]}>Continue with {provider}</Text>
  </TouchableOpacity>
);

const Divider = ({ text }) => (
  <View style={dividerStyles.container}>
    <View style={dividerStyles.line} />
    <Text style={dividerStyles.text}>{text}</Text>
    <View style={dividerStyles.line} />
  </View>
);

const InputDesign = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSignUp = () => {
    console.log({ email, password, confirmPassword });
  };

  const handleSignIn = () => {
    console.log("Navigate to sign in");
  };

  return (
    <View style={inputDesignStyles.container}>
      <SignUpHeader />

      <InputField
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={inputDesignStyles.inputSpacing}
      />
      <InputField
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={inputDesignStyles.inputSpacing}
      />
      <InputField
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        style={inputDesignStyles.inputSpacing}
      />

      <TouchableOpacity style={inputDesignStyles.signUpButton} onPress={handleSignUp}>
        <Text style={inputDesignStyles.signUpButtonText}>Sign Up</Text>
      </TouchableOpacity>

      <Divider text="Or continue with" />

      <SocialButton
        provider="Google"
        style={inputDesignStyles.googleButton}
        textStyle={inputDesignStyles.googleButtonText}
      />
      <SocialButton
        provider="Apple"
        style={inputDesignStyles.appleButton}
        textStyle={inputDesignStyles.appleButtonText}
      />

      <TouchableOpacity style={inputDesignStyles.signInContainer} onPress={handleSignIn}>
        <Text style={inputDesignStyles.signInText}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );
};

const SignUpScreen = () => (
  <SafeAreaView style={screenStyles.container}>
    <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
    <InputDesign />
  </SafeAreaView>
);

export default SignUpScreen;

const headerStyles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    fontFamily: "Inter",
    color: "#000",
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Inter",
    marginTop: 8,
    color: "#000",
  },
});

const inputFieldStyles = StyleSheet.create({
  container: {
    width: 325,
    height: 58,
  },
  input: {
    width: "100%",
    height: "100%",
    borderRadius: 29,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 20,
    color: "#868181",
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "600",
  },
});

const socialButtonStyles = StyleSheet.create({
  button: {
    width: 306,
    height: 64,
    borderRadius: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "600",
  },
});

const dividerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    width: "80%",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  text: {
    paddingHorizontal: 10,
    color: "#636363",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "600",
  },
});

const inputDesignStyles = StyleSheet.create({
  container: {
    flex: 1,
    width: 390,
    alignSelf: "center",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
  },
  inputSpacing: {
    marginTop: 20,
  },
  signUpButton: {
    width: 325,
    height: 64,
    borderRadius: 1000,
    backgroundColor: "#418EDA",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 25,
  },
  signUpButtonText: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "600",
  },
  googleButton: {
    width: 306,
    height: 64,
    borderRadius: 1000,
    backgroundColor: "#418EDA",
    marginTop: 20,
  },
  googleButtonText: {
    color: "#FFF",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "600",
  },
  appleButton: {
    width: 306,
    height: 64,
    borderRadius: 1000,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginTop: 20,
  },
  appleButtonText: {
    color: "#000",
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "600",
  },
  signInContainer: {
    marginTop: 15,
  },
  signInText: {
    color: "#928A8A",
    textAlign: "center",
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "600",
  },
});

const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
});
