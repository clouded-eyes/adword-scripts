
//////////////////////////////////////////////////////////////////////
// Settings
//////////////////////////////////////////////////////////////////////
// Use this part to control filtering and functioning of script

//Control Settings
var accountNameFilter = 'Perodua - Monthly Sales Campaign';

//can use ENABLED, PAUSED, REMOVED
var campaignStatus = 'ENABLED';

//////////////////////////////////////////////////////////////////////

function main() {
  	
  	//Creates a new Spreadsheet
  	var spreadsheet = SpreadsheetApp.create('Settings Audit: '+accountNameFilter);
  	var spreadsheetURL = spreadsheet.getUrl();
  	Logger.log(spreadsheetURL);
  	
  	//Account Iterator 
	var accountSelector = MccApp
     	.accounts()
     	.withCondition("Name CONTAINS_IGNORE_CASE '"+accountNameFilter+"'")
    	.orderBy("Name ASC");
  
  	var accountIterator = accountSelector.get();

 	while (accountIterator.hasNext()) {
   		var account = accountIterator.next();
      	
      	MccApp.select(account);
      
      	var accountName = account.getName();
      	
      	//Create a new spreadsheet for each account
      	var newSheet1 = spreadsheet.insertSheet(accountName+' | account Report'); 
  		
      	//Query and push main account settings in spreadsheet
      	var accountReport = AdWordsApp.report(
    	'SELECT AccountDescriptiveName, AccountCurrencyCode, AccountTimeZone, IsAutoTaggingEnabled ' +
    	'FROM   ACCOUNT_PERFORMANCE_REPORT ' +
    	'DURING LAST_30_DAYS');
      	
      	accountReport.exportToSheet(spreadsheet.setActiveSheet(newSheet1));
      
        //To get Lin-Rodnitzky Ratio
        var accountReport = AdsApp.report(
          	"SELECT AdNetworkType1, Cost, Conversions, CostPerConversion " +
          	"FROM   ACCOUNT_PERFORMANCE_REPORT " +
         	"WHERE " +
          		"AdNetworkType1 = SEARCH " +
          		"AND Conversions > 0 " +
          	"DURING LAST_30_DAYS");
      
      
      
      
      	Logger.log(accountName);

      //Generate Ads Reports from _REPORT method
      exportReportToSpreadsheet(accountName, spreadsheet);
      
      	
      var campaignSelector = AdsApp
         	.campaigns()
          	.withCondition("Status = '"+campaignStatus+"'")
          	.orderBy("Name ASC");
      var campaignIterator = campaignSelector.get();
       
      var campaignDataTable = [['Is Campaign Enabled','Campaign Name','Bid Strategy Type', 'Ad Rotation Type', 'Locations', 'Languages', 'Audiences', 'Ad Schedule', 'Devices', 'Avg. No. of Enabled KW/AdGroup']];
      	
      while (campaignIterator.hasNext()) {
        var campaign = campaignIterator.next();
        //Primary Campaign Settings
        var settingsIsCampaignEnabled = campaign.isEnabled();
        var settingsCampaignName = campaign.getName();	
        var settingsAdRotation = campaign.getAdRotationType();
        var settingsBidStrategyType = campaign.getBiddingStrategyType();
        //Secondary Campaign Targetings
        var settingsTargetings = campaign.targeting();
        
        //Initating Variables
        var settingsTargetingsLanguage = [];
        var settingsTargetingsLocations = [];
        var settingsTargetingsAudiences = [];
        var settingsTargetingsSchedules = [];
        var settingsTargetingsDevices = [];
        var settingsLinRodnitzkyRatio = [];
        
        //Selectors to get Attributes
     	var languageSelector = settingsTargetings.languages();
          	var languageIterator = languageSelector.get();
          	while (languageIterator.hasNext()) {
              var language = languageIterator.next();
              settingsTargetingsLanguage.push(language.getName());
            }
        
        var locationSelector = settingsTargetings.targetedLocations();
          	var locationIterator = locationSelector.get();
          	while (locationIterator.hasNext()) {
              var location = locationIterator.next();
              settingsTargetingsLocations.push(location.getName());
            }
        
        var audienceSelector = settingsTargetings.audiences();
          	var audienceIterator = audienceSelector.get();
          	while (audienceIterator.hasNext()) {
              var audience = audienceIterator.next();
              settingsTargetingsAudiences.push(audience.getName());
            }
        
        var scheduleSelector = settingsTargetings.adSchedules();
          	var scheduleIterator = scheduleSelector.get();
          	while (scheduleIterator.hasNext()) {
              var schedule = scheduleIterator.next();
              var scheduleDayOfWeek = schedule.getDayOfWeek().substring(0,2);
              var scheduleStartHour = schedule.getStartHour();
              var scheduleStartMinute = schedule.getStartMinute();
              var scheduleEndHour = schedule.getEndHour();
              var scheduleEndMinute = schedule.getEndMinute();
              var scheduleBidModifier = schedule.getBidModifier();
              var scheduleEntity = scheduleDayOfWeek.toString()+' '+scheduleStartHour.toString()+':'+scheduleStartMinute.toString()+'-'+scheduleEndHour.toString()+':'+scheduleEndMinute.toString()+', bid:'+scheduleBidModifier
              settingsTargetingsSchedules.push(scheduleEntity);
            }

        var deviceSelector = settingsTargetings.platforms();
          	var deviceIterator = deviceSelector.get();
          	while (deviceIterator.hasNext()) {
              var device = deviceIterator.next();
              var deviceDetails = device.getName().substring(0,1)+' bid:'+device.getBidModifier();
              settingsTargetingsDevices.push(deviceDetails);
            }
        
        // Number counters
        var numberOfEnabledAdGroups = 0;
        var numberOfEnabledKeywords = 0;
        
        var enabledAdGroupSelector = campaign.adGroups().withCondition("Status = ENABLED");
          	var enabledAdGroupSelectorIterator = enabledAdGroupSelector.get();
        	numberOfEnabledAdGroups = enabledAdGroupSelectorIterator.totalNumEntities();
          	while (enabledAdGroupSelectorIterator.hasNext()) {
              var enabledAdGroups = enabledAdGroupSelectorIterator.next();
              var numberOfEnabledKeywordsInAdGroup = enabledAdGroups.keywords().withCondition("Status = ENABLED").get().totalNumEntities();
              numberOfEnabledKeywords += numberOfEnabledKeywordsInAdGroup;
            }
        
        var settingsAvgNumberOfEnabledKeywordsPerAdGroup = numberOfEnabledKeywords/numberOfEnabledAdGroups;

        
          	var reportRow = [settingsIsCampaignEnabled, settingsCampaignName,settingsBidStrategyType, settingsAdRotation, settingsTargetingsLocations.toString(), settingsTargetingsLanguage.toString(), settingsTargetingsAudiences.toString(), settingsTargetingsSchedules.toString(), settingsTargetingsDevices.toString(), settingsAvgNumberOfEnabledKeywordsPerAdGroup];
            campaignDataTable.push(reportRow);
        
      }
      
      	
      	var ss = SpreadsheetApp.openByUrl(spreadsheetURL);
      	ss.getSheetByName(accountName+' | account Report').activate().getRange(4, 1, campaignDataTable.length, campaignDataTable[0].length).setValues(campaignDataTable);
      	/*
      	var ssCampaignDataTable = accountName+' | Campaign Report V2'
      	ss.insertSheet(ssCampaignDataTable);
      	ss.getSheetByName(ssCampaignDataTable).activate().getRange(3, 1, campaignDataTable.length, campaignDataTable[0].length).setValues(campaignDataTable);
		*/ 	
    }
  	
  	//Remove extra sheets
  	var ss = SpreadsheetApp.openByUrl(spreadsheetURL);
	var sheet1 = ss.getSheetByName('Sheet1');
	ss.deleteSheet(sheet1);
  	
}

// Campaign Level Report Generator
function exportReportToSpreadsheet(accountName, spreadsheet) {
    
  //Original for Comparison
   
  
  
  
}
