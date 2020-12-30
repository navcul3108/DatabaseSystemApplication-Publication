const articleFilterTypes = {
    haveNotEditor: "haveNotEditor",
    haveNotAnyReviewer: "haveNotAnyReviewer",
    sending: "sending",
    reviewing: "reviewing",
    feedbacking: "feedbacking",
    reviewed: "reviewed",
    published: "published",
    posted: "posted"
}

$(document).ready(()=>{
    filterArticle();
})

function filterArticle() {
    const selectedVal = $("select").val();
    $.ajax({
        url: "filter-article",
        method: "GET",
        dataType: "json",
        data: {filterState: selectedVal},
        success: (data)=>{
            // data is list of article profiles
            const articleProfile = JSON.parse(data);
            $("tbody tr").remove();
            let content = "";
            articleProfile.forEach(profile=>{
                content+= genRowHtmlCode(selectedVal, profile);
            })
            $("tbody").html(content);
        },
        error: (err)=>{
            console.log(err);
            alert("Đã xảy ra lỗi");
        }
    })
    
}

function genRowHtmlCode(filtertype, articleProfile){
    let methodHtmlCode = "";
    switch (filtertype) {
        case articleFilterTypes.haveNotEditor:
            methodHtmlCode = `<form action="accept-article" method="post">
                                <button class="btn btn-success" type="submit">Chấp nhận</button>
                                <input type="hidden" name="code" value="${articleProfile.code}">
                                </form>`
            break;
        case articleFilterTypes.haveNotAnyReviewer:
            methodHtmlCode = `<a class="btn btn-sm btn-success" href="assign-reviewers-for-an-article?code=${articleProfile.code}">Phân công</a>`
            break;
        case articleFilterTypes.sending:
            methodHtmlCode = `<a class="d-inline mr-2 btn btn-sm btn-success" href="assign-reviewers-for-an-article?code=${articleProfile.code}">Phân công</a>
                              <a class="d-inline btn btn-sm btn-success" href="view-article-detail?code=${articleProfile.code}">Chi tiết</a>`
            break;
        default: 
            methodHtmlCode = `<a class="btn btn-sm btn-success" href="view-article-detail?code=${articleProfile.code}">Chi tiết</a>`;
    }
    return `<tr>
                <td>${articleProfile.code}</td>
                <td>${articleProfile.title}</td>
                <td>${articleProfile.sendingDate}</td>
                <td>${articleProfile.type}</td>
                <td>${articleProfile.state}</td>
                <td>${methodHtmlCode}<td>
            </tr>`
}