module.exports = {
  urls: [
    // "https://sa.ucla.edu/ro/Public/SOC/Results/ClassDetail?term_cd=22F&subj_area_cd=EC%20ENGR&crs_catlg_no=0188%20%20%20%20&class_id=439828200&class_no=%20001%20%20",
    "https://sa.ucla.edu/ro/Public/SOC/Results/ClassDetail?term_cd=22F&subj_area_cd=EC%20ENGR&crs_catlg_no=0116C%20M%20&class_id=439398100&class_no=%20001%20%20",
    "https://sa.ucla.edu/ro/Public/SOC/Results/ClassDetail?term_cd=22F&subj_area_cd=COM%20SCI&crs_catlg_no=0131%20%20%20%20&class_id=187510200&class_no=%20001%20%20",
    "https://sa.ucla.edu/ro/Public/SOC/Results/ClassDetail?term_cd=22F&subj_area_cd=COM%20SCI&crs_catlg_no=0188%20%20%20%20&class_id=187827200&class_no=%20001%20%20",
  ],

  exchangeUrls: {
    // "EC ENGR 188":
    //   "https://sa.ucla.edu/ro/ClassSearch/Results?SubjectAreaName=Computer+Science+(COM+SCI)&CrsCatlgName=131+-+Programming+Languages&t=22F&sBy=subject&subj=COM+SCI&catlg=0131&cls_no=%25&undefined=Go&IsClassExchange=true&dropClassId=187787202&btnIsInIndex=btn_inIndex",
    "COM SCI 188":
      "https://sa.ucla.edu/ro/ClassSearch/Results?SubjectAreaName=Computer+Science+(COM+SCI)&CrsCatlgName=188+-+Natural+Language+Processing&t=22F&sBy=subject&subj=COM+SCI&catlg=0188&cls_no=+001++&undefined=Go&IsClassExchange=true&dropClassId=&btnIsInIndex=btn_inIndex",
    "COM SCI 131":
      "https://sa.ucla.edu/ro/ClassSearch/Results?SubjectAreaName=Computer+Science+(COM+SCI)&CrsCatlgName=131+-+Programming+Languages&t=22F&sBy=subject&subj=COM+SCI&catlg=0131&cls_no=%25&undefined=Go&IsClassExchange=true&dropClassId=187787202&btnIsInIndex=btn_inIndex",
    "EC ENGR M116C":
      "https://sa.ucla.edu/ro/ClassSearch/Results?SubjectAreaName=Electrical+and+Computer+Engineering+(EC+ENGR)&CrsCatlgName=M116C+-+Computer+Systems+Architecture&t=22F&sBy=subject&subj=EC+ENGR&catlg=0116C+M&cls_no=%25&undefined=Go&IsClassExchange=true&dropClassId=&btnIsInIndex=btn_inIndex",
  },

  // How often to check the SOC links (in microseconds)
  freq: 1000 * 30,
};
