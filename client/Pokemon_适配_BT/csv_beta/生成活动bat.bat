@echo off

set YYYYmmdd=%date:~0,4%%date:~5,2%%date:~8,2%
set hhmiss=%time:~0,2%%time:~3,2%%time:~6,2%
set folder=%YYYYmmdd%_%hhmiss%
set folder=%folder: =0%
echo %folder%

set cur=%cd%

cd ..

md %folder%

set pre=%cd%
echo %cd%
set target=%pre%\%folder%
echo %pre%\%folder%
cd %cur%
echo %cur%
copy THuoSevenLg_���յ�½.csv %target%\1_THuoSevenLg_���յ�½.csv
copy THuoZhuanPan_ת�̻.csv %target%\2_THuoZhuanPan_ת�̻.csv
copy THuoZhandou_�ս��.csv %target%\3_THuoZhandou_�ս��.csv
copy THuoRechargeSum_�ۼƳ�ֵ�.csv %target%\4_THuoRechargeSum_�ۼƳ�ֵ�.csv
copy TDiamondCon_��ʯ����.csv %target%\5_TDiamondCon_��ʯ����.csv
copy TFlashElf_���⾫��.csv %target%\6_TFlashElf_���⾫��.csv
copy TPremiumPacks_��ֵ�Ż����.csv %target%\7_TPremiumPacks_��ֵ�Ż����.csv
copy THuoSuperElf_��������.csv %target%\8_THuoSuperElf_��������.csv
copy TRechargeElfin_�۳徫��.csv %target%\9_TRechargeElfin_�۳徫��.csv
copy TAppointmentGift_ԤԼ���.csv %target%\10_TAppointmentGift_ԤԼ���.csv
copy TDailyGifts_ÿ������.csv %target%\11_TDailyGifts_ÿ������.csv
copy TChristmasEve_Ԫ������.csv %target%\12_TChristmasEve_Ԫ������.csv
copy THuoOneRMB_һԪ���.csv %target%\100_THuoOneRMB_һԪ���.csv
copy THuoRechargeFrist_�׳����.csv %target%\101_THuoRechargeFrist_�׳����.csv
copy THuoYue_�¿�.csv %target%\102_THuoYue_�¿�.csv
copy THuoZhongSheng_������.csv %target%\103_THuoZhongSheng_������.csv
copy THuoVipfuli_VIPÿ�����.csv %target%\104_THuoVipfuli_VIPÿ�����.csv
copy THuoChengZhang_�ɳ��ƻ�.csv %target%\105_THuoChengZhang_�ɳ��ƻ�.csv
copy THuoRedElf_���޽���.csv %target%\106_THuoRedElf_���޽���.csv
copy TDailyCon_ÿ������.csv %target%\107_TDailyCon_ÿ������.csv
copy TDailyRecharge_ÿ�ճ�ֵ.csv %target%\108_TDailyRecharge_ÿ�ճ�ֵ.csv
copy TLvaCtivity_�ȼ��.csv %target%\109_TLvaCtivity_�ȼ��.csv
copy TRecharge49_��ֵ49Ԫ.csv %target%\110_TRecharge49_��ֵ49Ԫ.csv
copy TMammonRabbit_������.csv %target%\111_TMammonRabbit_������.csv
copy THuoCollent_���ֻ.csv %target%\112_THuoCollent_���ֻ.csv
copy TDecennium_ʮ������.csv %target%\113_TDecennium_ʮ������.csv
copy THuoPolite_��¼����.csv %target%\114_THuoPolite_��¼����.csv
copy TGoldenEggs_������.csv %target%\115_TGoldenEggs_������.csv
copy TDaysDiamond_�콵��ʯ.csv %target%\116_TDaysDiamond_�콵��ʯ.csv
copy TFirstGroupon_�׳��Ź�.csv %target%\117_TFirstGroupon_�׳��Ź�.csv
copy TOpencompetition_��������.csv %target%\118_TOpencompetition_��������.csv
copy THappyMidAutumn_���Ｏ��.csv %target%\119_THappyMidAutumn_���Ｏ��.csv
copy TMooncake_�±��.csv %target%\120_TMooncake_�±��.csv
copy TYuanyuan_ԲԲ�±�.csv %target%\121_TYuanyuan_ԲԲ�±�.csv
copy TRechargeDouble_��ֵ˫��.csv %target%\122_TRechargeDouble_��ֵ˫��.csv
copy THuoConsumption_���Ѵ�Ѫƴ.csv %target%\123_THuoConsumption_���Ѵ�Ѫƴ.csv
copy TPrimeCharge_�����׳�.csv %target%\124_TPrimeCharge_�����׳�.csv
copy TTestFree_����.csv %target%\125_TTestFree_����.csv
copy THallowmas_��ʥ��.csv %target%\126_THallowmas_��ʥ��.csv
copy TEverydayRecharge_�����ֵ.csv %target%\127_TEverydayRecharge_�����ֵ.csv
copy Tbigcompete_�������ƴ.csv %target%\128_Tbigcompete_�������ƴ.csv
copy TVipLvaward_VIP�ȼ�����.csv %target%\129_TVipLvaward_VIP�ȼ�����.csv
copy TEntryYuandan_Ԫ�����.csv %target%\130_TEntryYuandan_Ԫ�����.csv
copy TLuckZhuanPan_����ת��.csv %target%\131_TLuckZhuanPan_����ת��.csv
copy TYuandanReward_Ԫ������.csv %target%\132_TYuandanReward_Ԫ������.csv
copy TSevendaysReward_��������.csv %target%\133_TSevendaysReward_��������.csv
copy TLvaCtivity2_�ȼ��2.csv %target%\137_TLvaCtivity2_�ȼ��2.csv
copy TSevenDaysCompetition_���վ���.csv %target%\138_TLvaCtivity2_���վ���.csv
copy TElfOneInThree_������ѡһ.csv %target%\139_TElfOneInThree_������ѡһ.csv


pause