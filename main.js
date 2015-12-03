(function (global, $, Rx) {
  'use strict';

  function lookupFXrate(amount) {
    var promise = $.ajax({
      xhrFields: {
          withCredentials: true
      },
      dataType: 'html',
      type: "GET",
      url:'text.html'
    }).promise();

    return Rx.Observable.fromPromise(promise);
    
 }

  var baselines = {chinese: 3500, expat: 4800};
  var cutoffs = [0,1500,4500,9000,35000,55000,80000];
  var taxRates = [3,10,20,25,30,35,45];
  var quickRates = [0,105,555,1005,2755,5505,13505];

  function baseline(name){
    return baselines[name];
  }

  function range(level, taxable){
  	 return (level < 0) ? taxable : (taxable < cutoffs[level]) ? range(level - 1, taxable) : ((taxable * taxRates[level]) / 100) - quickRates[level];
  }

  function deduction(beforeTaxAmount, baseline) {
    return beforeTaxAmount > baseline ? beforeTaxAmount - baseline : 0;
  }


  function rateExtractor(htmlText){
     $.parseHTML(htmlText).find( ".numberright" ).fisrt().html();
  }

  function afterTax(deducted, baseline){
    return deducted > baseline ? deducted + baseline - range(6, deducted) : deducted; 
  }


  function annual(monthly){
  	return 12 * monthly;
  }

  function totalOf(monthly, monthes){
    return monthes * monthly;
  }

  function main(){
  	var $amountInput = $('#beforeTaxAmount'),
        $afterTaxOutput = $('#afterTaxAmount'),
        $annualOutput = $('#annualAmount'),
        $convertedOutput = $('#convertedAmount');

    var deductionBasline = Rx.Observable.merge( Rx.Observable.fromEvent($('#chinese'), 'click'), Rx.Observable.fromEvent($('#expat'), 'click') )
      .map(function (e) {
        return e.target.id; // Project the text from the input
      })
      .map(baseline);

	  var amount = Rx.Observable.fromEvent($amountInput, 'keyup')
      .map(function (e) {
        return e.target.value; // Project the text from the input
      })
      .filter(function (text) {
        return text.length > 2; // Only if the text is longer than 2 characters
      })
      .debounce(150)
      .distinctUntilChanged(); // Only if the value has changed


     var baseAmount = Rx.Observable.combineLatest(amount, deductionBasline, deduction);
     var afterTaxAmount = Rx.Observable.combineLatest(baseAmount, deductionBasline, afterTax);

     afterTaxAmount.subscribe(
      function (data) {
        $afterTaxOutput.val(data);
      },
      function (error) {
        $afterTaxOutput.empty()
     
      });

      var annualAmount = baseAmount.map(annual);

      annualAmount.subscribe(
      function (data) {
        $annualOutput.val(data);
      },
      function (error) {
        $annualOutput.empty()
      });

      // annualAmount.flatMap(lookupFXrate).subscribe(
      // function (data) {
      //   console.dir(data);
      //   $convertedAmount.val(rateExtractor(data));
      // },
      // function (error) {
      //    console.dir(error);
      //   $convertedAmount.val(0);
      // });
  }

  $(main);

}(window, jQuery, Rx));