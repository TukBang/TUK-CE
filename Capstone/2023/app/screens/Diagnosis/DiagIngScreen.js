import React, { 
    useState,
    useEffect,
  } from "react";
  import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
  import RNFS from "react-native-fs";
import { createDiagnosisResult } from "../../lib/diagnosis";
import storage from "@react-native-firebase/storage";
import { v4 } from "uuid";
import events from "../../lib/events";
  




  function DiagIngScreen ({
    aiResult,setAiResult,
    petList,uid,
    selectedImage, setSelectedImage,
    setDiagState,setDiagEnd,setDiagtempView,setDiagModalVisible,
    setDiagnosisResultText2,
}) {

    const serverUrl = "http://121.170.118.190:5000/images";
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////  
  // 진단 선택 스크린
  let DiagnosisText1 = `진단하려는 사진을 확인해주세요.`;
  let DiagnosisText2 = `  [Tip]\n  환부가 잘 보이고, 이미지가 클수록 정확도가 향상됩니다!`;
  let buttonText1 = `다시 선택하기`;
  let buttonText2 = `진단하기`;
  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  useEffect(() => {
    console.log(aiResult);
  }, [aiResult]);


  const handlePostRequest = async () => {
    try {
      const extension = selectedImage.path.split(".").pop();
      var reference = storage().ref(`/photo/${uid}/${v4()}.${extension}`);
      const image = await RNFS.readFile(selectedImage.path, "base64");
      const petName = petList.petName;
      const petSpecies = petList.petKind;
      const petAge = petList.petAge;
      const petWeight = petList.petWeight;
      const petGender = petList.petGender;
      const petID = petList.petID
      const petImage = petList.petImage
      const response = await fetch(serverUrl, {
        method: "POST",  
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          /* 더 많은 펫 정보들을 담을 수 있다면 추후 추가 필요 (2023-05-02) */
          uid:     uid,
          name:    petName,
          species: petSpecies,
          gender:  petGender,
          weight:  petWeight,
          age:     petAge,
          imageName:
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) +
            ".jpg",
          image: image,
        }),
      });
      if (Platform.OS === "android") {
        await reference.putString(image, "base64", { contentType: selectedImage.mime });
      } else {
        await reference.putFile(selectedImage.path);
      }

      var petdiagImage = await reference.getDownloadURL();
      let predictions = await response.json();
      console.log('set이전 predic',predictions)
      await setAiResult((prevState) => ({
        ...prevState,
        predictions: [
          predictions["L1"],
          predictions["L2"],
          predictions["L3"],
          predictions["L4"],
          predictions["L5"],
          predictions["L6"],
        ]
      }))
      console.log('set직후' ,aiResult)
      await createDiagnosisResult({
        userID: uid, 
        petName: petName,
        petSpecies: petSpecies,
        petGender: petGender,
        petWeight: petWeight,
        petAge: petAge,
        petID: petID,
        prediction : aiResult,
        petImage: petImage,
        image: petdiagImage,
      })
      events.emit("refresh");



      setDiagState(true);
      setDiagEnd(true);      
    } catch (error) {
      // 서버 오류나서 진단 실패되면 진행
      // 초기화면으로 갈 수 있도록 설정
      console.error(error);
      setSelectedImage(null);
      setDiagtempView(false);
      setDiagState(false);
      setDiagEnd(false);
    }
  };
    
  return(
      <>
        <Text style={diagnosisSelectStyles.text1}>{DiagnosisText1}</Text>
        <Text style={diagnosisSelectStyles.text2}>{DiagnosisText2}</Text>
        <View style={diagnosisSelectStyles.imageView}>
          <Image
            source={{ uri: selectedImage.path }}
            style={diagnosisSelectStyles.image}
            resizeMode="contain"
          />
        </View>

        {/* 어떤 펫을 진단하는지 카테고리 형식으로 선택할 수 있는 요소 구성 필요함 */}
        {/* 현재는 임시로 불러들인 펫 리스트의 첫번째를 전송함 (2023-05-02) */}

        <View style={diagnosisSelectStyles.button_container}>
          <TouchableOpacity
            style={diagnosisSelectStyles.button}
            onPress={() => {
              setDiagState(false);
              // AI 서버에 이미지 전송
              // 0번째 펫을 선택하도록 설정 (카테고리 선택 요소에 따라 바뀔 수 있도록 변경 필요 2023-05-02)
              handlePostRequest();

              // 진단 모달 띄우기
              setDiagtempView(true);
              setDiagModalVisible(true);
            }}
          >
            <Text style={diagnosisSelectStyles.buttonText}>{buttonText2}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={diagnosisSelectStyles.button}
            onPress={() => setSelectedImage(null)}
          >
            <Text style={diagnosisSelectStyles.buttonText}>{buttonText1}</Text>
          </TouchableOpacity>
        </View>
      </>

    )
  }


  // 진단 선택 스타일
const diagnosisSelectStyles = StyleSheet.create({
  text1: {
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,

    fontSize: 20,
  },

  text2: {
    marginBottom: 40,
    marginLeft: 10,

    fontSize: 15,
    fontWeight: "bold",
  },

  imageView: {
    alignItems: "center",

    height: 300,
    width: "100%",

    // 여백
    marginBottom: 30,
  },

  image: {
    width: 300,
    height: 300,
  },

  button_container: {
    // 정렬
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",

    // 여백
    marginTop: 20,
    marginLeft: 30,
    marginRight: 30,
  },

  button: {
    // 정렬
    justifyContent: "center",
    alignItems: "center",

    height: 40,
    width: 330,

    // 여백
    marginTop: 10,

    // 모양
    borderRadius: 5,

    // 배경색
    backgroundColor: "#3A8DF8",
  },

  // 버튼 텍스트
  buttonText: {
    fontSize: 15,
    color: "#FFFFFF",
  },
});
export default DiagIngScreen