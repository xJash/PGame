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
copy THuoSevenLg_七日登陆.csv %target%\1_THuoSevenLg_七日登陆.csv
copy THuoZhuanPan_转盘活动.csv %target%\2_THuoZhuanPan_转盘活动.csv
copy THuoZhandou_活动战斗.csv %target%\3_THuoZhandou_活动战斗.csv
copy THuoRechargeSum_累计充值活动.csv %target%\4_THuoRechargeSum_累计充值活动.csv
copy TDiamondCon_钻石消费.csv %target%\5_TDiamondCon_钻石消费.csv
copy TFlashElf_闪光精灵.csv %target%\6_TFlashElf_闪光精灵.csv
copy TPremiumPacks_超值优惠礼包.csv %target%\7_TPremiumPacks_超值优惠礼包.csv
copy THuoSuperElf_超级精灵.csv %target%\8_THuoSuperElf_超级精灵.csv
copy TRechargeElfin_累冲精灵.csv %target%\9_TRechargeElfin_累冲精灵.csv
copy TAppointmentGift_预约礼包.csv %target%\10_TAppointmentGift_预约礼包.csv
copy TDailyGifts_每日送礼.csv %target%\11_TDailyGifts_每日送礼.csv
copy TChristmasEve_元旦精灵.csv %target%\12_TChristmasEve_元旦精灵.csv
copy THuoOneRMB_一元礼包.csv %target%\100_THuoOneRMB_一元礼包.csv
copy THuoRechargeFrist_首充礼包.csv %target%\101_THuoRechargeFrist_首充礼包.csv
copy THuoYue_月卡.csv %target%\102_THuoYue_月卡.csv
copy THuoZhongSheng_终生卡.csv %target%\103_THuoZhongSheng_终生卡.csv
copy THuoVipfuli_VIP每日礼包.csv %target%\104_THuoVipfuli_VIP每日礼包.csv
copy THuoChengZhang_成长计划.csv %target%\105_THuoChengZhang_成长计划.csv
copy THuoRedElf_神兽降临.csv %target%\106_THuoRedElf_神兽降临.csv
copy TDailyCon_每日消费.csv %target%\107_TDailyCon_每日消费.csv
copy TDailyRecharge_每日充值.csv %target%\108_TDailyRecharge_每日充值.csv
copy TLvaCtivity_等级活动.csv %target%\109_TLvaCtivity_等级活动.csv
copy TRecharge49_充值49元.csv %target%\110_TRecharge49_充值49元.csv
copy TMammonRabbit_财神兔.csv %target%\111_TMammonRabbit_财神兔.csv
copy THuoCollent_集字活动.csv %target%\112_THuoCollent_集字活动.csv
copy TDecennium_十连福利.csv %target%\113_TDecennium_十连福利.csv
copy THuoPolite_登录有礼.csv %target%\114_THuoPolite_登录有礼.csv
copy TGoldenEggs_金蛋送礼.csv %target%\115_TGoldenEggs_金蛋送礼.csv
copy TDaysDiamond_天降钻石.csv %target%\116_TDaysDiamond_天降钻石.csv
copy TFirstGroupon_首充团购.csv %target%\117_TFirstGroupon_首充团购.csv
copy TOpencompetition_开服竞赛.csv %target%\118_TOpencompetition_开服竞赛.csv
copy THappyMidAutumn_中秋集字.csv %target%\119_THappyMidAutumn_中秋集字.csv
copy TMooncake_月饼活动.csv %target%\120_TMooncake_月饼活动.csv
copy TYuanyuan_圆圆月饼.csv %target%\121_TYuanyuan_圆圆月饼.csv
copy TRechargeDouble_充值双倍.csv %target%\122_TRechargeDouble_充值双倍.csv
copy THuoConsumption_消费大血拼.csv %target%\123_THuoConsumption_消费大血拼.csv
copy TPrimeCharge_至尊首充.csv %target%\124_TPrimeCharge_至尊首充.csv
copy TTestFree_回馈.csv %target%\125_TTestFree_回馈.csv
copy THallowmas_万圣节.csv %target%\126_THallowmas_万圣节.csv
copy TEverydayRecharge_天天充值.csv %target%\127_TEverydayRecharge_天天充值.csv
copy Tbigcompete_开服大比拼.csv %target%\128_Tbigcompete_开服大比拼.csv
copy TVipLvaward_VIP等级奖励.csv %target%\129_TVipLvaward_VIP等级奖励.csv
copy TEntryYuandan_元旦入口.csv %target%\130_TEntryYuandan_元旦入口.csv
copy TLuckZhuanPan_幸运转盘.csv %target%\131_TLuckZhuanPan_幸运转盘.csv
copy TYuandanReward_元旦任务.csv %target%\132_TYuandanReward_元旦任务.csv
copy TSevendaysReward_七日任务.csv %target%\133_TSevendaysReward_七日任务.csv
copy TLvaCtivity2_等级活动2.csv %target%\137_TLvaCtivity2_等级活动2.csv
copy TSevenDaysCompetition_七日竞赛.csv %target%\138_TLvaCtivity2_七日竞赛.csv
copy TElfOneInThree_精灵三选一.csv %target%\139_TElfOneInThree_精灵三选一.csv


pause